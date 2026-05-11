import { HELP_CATEGORIES, HELP_DOCS, sortHelpDocs } from './docs';

function normalizeSearchText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function sectionToSearchText(section) {
  if (!section) return '';

  return [
    section.title,
    section.body,
    Array.isArray(section.items) ? section.items.join(' ') : '',
    section.action,
  ]
    .filter(Boolean)
    .join(' ');
}

function docToSearchText(doc, category) {
  return [
    doc.title,
    doc.summary,
    category?.title,
    category?.description,
    Array.isArray(doc.keywords) ? doc.keywords.join(' ') : '',
    Array.isArray(doc.sections) ? doc.sections.map(sectionToSearchText).join(' ') : '',
  ]
    .filter(Boolean)
    .join(' ');
}

export function buildHelpSearchIndex(docs = HELP_DOCS) {
  const categoryById = new Map(HELP_CATEGORIES.map((category) => [category.id, category]));

  return sortHelpDocs(docs).map((doc) => {
    const category = categoryById.get(doc.categoryId) || null;
    return {
      id: doc.id,
      title: doc.title,
      summary: doc.summary,
      categoryId: doc.categoryId,
      categoryTitle: category?.title || '',
      roles: doc.roles || [],
      permissions: doc.permissions || [],
      searchText: normalizeSearchText(docToSearchText(doc, category)),
    };
  });
}

export function getHelpDocById(docId, docs = HELP_DOCS) {
  return docs.find((doc) => doc.id === docId) || null;
}

export function getVisibleHelpDocs(role, docs = HELP_DOCS) {
  return sortHelpDocs(docs).filter((doc) => {
    if (!Array.isArray(doc.roles) || doc.roles.length === 0) return true;
    return doc.roles.includes(role);
  });
}

export function searchHelpDocs(query, index = buildHelpSearchIndex()) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return index;

  const terms = normalizedQuery.split(' ').filter(Boolean);

  return index
    .map((entry) => {
      const title = normalizeSearchText(entry.title);
      const categoryTitle = normalizeSearchText(entry.categoryTitle);
      const score = terms.reduce((total, term) => {
        if (title.includes(term)) return total + 8;
        if (categoryTitle.includes(term)) return total + 4;
        if (entry.searchText.includes(term)) return total + 1;
        return total;
      }, 0);

      return { ...entry, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.title.localeCompare(right.title));
}
