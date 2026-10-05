import mongoose from 'mongoose';
import Product from '../models/Product.js';
import { invalidateCatalog, withCatalogCache } from '../services/cache.js';

const publicProduct = (product) => ({
  ...product,
  id: product._id.toString(),
});

const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

const parsePositiveInt = (value, fallback, max = 100) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildFilter = (query) => {
  const filter = { is_active: true };
  if (query.category) filter.category = query.category;
  if (query.min_price !== undefined) filter.price = { ...filter.price, $gte: Number(query.min_price) };
  if (query.max_price !== undefined) filter.price = { ...filter.price, $lte: Number(query.max_price) };
  if (query.featured === 'true') filter.is_featured = true;
  if (query.search) {
    const search = escapeRegex(query.search.trim());
    filter.$or = [
      { name: new RegExp(search, 'i') },
      { description: new RegExp(search, 'i') },
      { category: new RegExp(search, 'i') },
      { sub_category: new RegExp(search, 'i') },
      { tags: new RegExp(search, 'i') },
    ];
  }
  return filter;
};

const buildSort = (query) => {
  const direction = query.sortOrder === 'asc' ? 1 : -1;
  const sortMap = {
    created_at: { createdAt: direction },
    price: { price: direction },
    name: { name: 1 },
    popularity: { average_rating: -1, total_reviews: -1 },
    featured: { is_featured: -1, createdAt: -1 },
  };
  return sortMap[query.sortBy] || { createdAt: -1 };
};

export const getProducts = asyncHandler(async (req, res) => {
  const queryKey = JSON.stringify(req.query);
  const { value } = await withCatalogCache(queryKey, async () => {
    const page = parsePositiveInt(req.query.page, 1, 10000);
    const perPage = parsePositiveInt(req.query.per_page, 24, 100);
    const filter = buildFilter(req.query);
    const sort = buildSort(req.query);
    const [products, total] = await Promise.all([
      Product.find(filter).sort(sort).skip((page - 1) * perPage).limit(perPage).lean(),
      Product.countDocuments(filter),
    ]);
    return {
      products: products.map(publicProduct),
      pagination: {
        page,
        per_page: perPage,
        total,
        pages: Math.max(1, Math.ceil(total / perPage)),
      },
    };
  });
  res.json(value);
});

export const getProduct = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: 'Invalid product id' });
  }
  const { value } = await withCatalogCache(`product:${req.params.id}`, async () => {
    const product = await Product.findById(req.params.id).lean();
    return product ? { product: publicProduct(product) } : null;
  });
  if (!value) return res.status(404).json({ error: 'Product not found' });
  res.json(value);
});

/**
 * Scores and orders candidates against the product being viewed. Same category
 * outranks a tag-only match, shared tags outrank rating, and the source product
 * itself is always excluded even if the caller passed it in.
 */
export const rankRelated = (candidates, source, limit = 6) => {
  const tags = Array.isArray(source.tags) ? source.tags.filter(Boolean) : [];
  return candidates
    .filter((product) => String(product._id ?? product.id) !== String(source._id ?? source.id))
    // Relevance is re-checked here rather than trusted from the query alone, so
    // the ranking cannot surface a candidate that shares nothing with the
    // product being viewed.
    .filter(
      (product) =>
        product.category === source.category ||
        (source.sub_category && product.sub_category === source.sub_category) ||
        (product.tags || []).some((tag) => tags.includes(tag)),
    )
    .map((product) => {
      let score = 0;
      if (product.category === source.category) score += 4;
      if (source.sub_category && product.sub_category === source.sub_category) score += 2;
      const shared = tags.filter((tag) => (product.tags || []).includes(tag)).length;
      score += shared * 3;
      score += Math.min(Number(product.average_rating) || 0, 5) / 5;
      return { product, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ product }) => publicProduct(product));
};

export const getRelatedProducts = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: 'Invalid product id' });
  }
  const limit = parsePositiveInt(req.query.limit, 6, 12);
  const { value } = await withCatalogCache(`related:${req.params.id}:${limit}`, async () => {
    const source = await Product.findById(req.params.id).select('category sub_category tags price').lean();
    if (!source) return null;

    const tags = Array.isArray(source.tags) ? source.tags.filter(Boolean) : [];
    const orClauses = [{ category: source.category }];
    if (source.sub_category) orClauses.push({ sub_category: source.sub_category });
    if (tags.length) orClauses.push({ tags: { $in: tags } });

    const related = await Product.find({
      _id: { $ne: source._id },
      is_active: true,
      $or: orClauses,
    })
      .sort({ average_rating: -1, total_reviews: -1, createdAt: -1 })
      .limit(limit)
      .lean();

    // Ranking happens after the query because the score mixes category
    // overlap with rating, which MongoDB cannot express in a single sort.
    return { products: rankRelated(related, source, limit) };
  });

  if (!value) return res.status(404).json({ error: 'Product not found' });
  res.json(value);
});

export const getCategories = asyncHandler(async (req, res) => {
  const { value } = await withCatalogCache('categories', async () => {
    const categories = await Product.distinct('category', { is_active: true });
    return { categories: categories.sort() };
  });
  res.json(value);
});

export const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create({
    ...req.body,
    image_urls: Array.isArray(req.body.image_urls) ? req.body.image_urls : [],
    specifications: req.body.specifications || {},
  });
  await invalidateCatalog();
  res.status(201).json({ product: publicProduct(product) });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!product) return res.status(404).json({ error: 'Product not found' });
  await invalidateCatalog();
  res.json({ product: publicProduct(product) });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  await invalidateCatalog();
  res.json({ message: 'Product deleted' });
});

export const bulkUpdateProducts = asyncHandler(async (req, res) => {
  const productIds = Array.isArray(req.body.product_ids) ? req.body.product_ids : [];
  const result = await Product.updateMany({ _id: { $in: productIds } }, req.body.update_data || {});
  if (result.modifiedCount > 0) await invalidateCatalog();
  res.json({ modified: result.modifiedCount });
});
