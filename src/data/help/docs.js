import { ACTIONS, ROLES } from '../../auth';

export const HELP_SECTION_TYPES = {
  PARAGRAPH: 'paragraph',
  STEPS: 'steps',
  TIP: 'tip',
  WARNING: 'warning',
  PERMISSION: 'permission',
};

export const HELP_MEDIA_TYPES = {
  GIF: 'gif',
  VIDEO: 'video',
};

export const HELP_CATEGORIES = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    description: 'Learn the core workspace, navigation, and dashboard patterns.',
    order: 10,
  },
  {
    id: 'controls',
    title: 'Controls',
    description: 'Create, import, review, edit, and retire control records.',
    order: 20,
  },
  {
    id: 'requests',
    title: 'Requests',
    description: 'Create requests, assign work, and track request status.',
    order: 30,
  },
  {
    id: 'testing',
    title: 'Testing',
    description: 'Use the tracker, kanban, calendar, and test detail workflows.',
    order: 40,
  },
  {
    id: 'admin',
    title: 'Admin',
    description: 'Understand permissions, role behavior, and restricted actions.',
    order: 50,
  },
];

export const HELP_DOCS = [
  {
    id: 'platform-overview',
    title: 'Platform Overview',
    categoryId: 'getting-started',
    order: 10,
    summary: 'Understand the main areas of the control testing workspace.',
    roles: [ROLES.MANAGER, ROLES.TESTER],
    permissions: [ACTIONS.VIEW_SUMMARY, ACTIONS.VIEW_CONTROLS, ACTIONS.VIEW_TESTS],
    keywords: ['overview', 'dashboard', 'catalog', 'tracker', 'navigation', 'home'],
    media: {
      type: HELP_MEDIA_TYPES.VIDEO,
      src: '/help-assets/platform-overview.mp4',
      poster: '/help-assets/platform-overview-poster.png',
      title: 'Platform overview walkthrough',
    },
    sections: [
      {
        type: HELP_SECTION_TYPES.PARAGRAPH,
        body: 'The application is organized around Dashboard, Catalog, Tracker, and Help. Dashboard summarizes progress, Catalog manages control metadata, and Tracker manages testing work.',
      },
      {
        type: HELP_SECTION_TYPES.STEPS,
        title: 'Common navigation flow',
        items: [
          'Open Dashboard to review progress and capacity.',
          'Open Catalog to find or manage control metadata.',
          'Open Tracker to work with controls, requests, kanban, and calendar views.',
          'Open Help when you need workflow instructions or permission details.',
        ],
      },
    ],
  },
  {
    id: 'using-dashboard',
    title: 'Using the Dashboard',
    categoryId: 'getting-started',
    order: 20,
    summary: 'Read summary cards, distribution charts, progress updates, and capacity.',
    roles: [ROLES.MANAGER, ROLES.TESTER],
    permissions: [ACTIONS.VIEW_SUMMARY, ACTIONS.EXPORT_SUMMARY],
    keywords: ['dashboard', 'summary', 'capacity', 'progress', 'distribution', 'export'],
    media: {
      type: HELP_MEDIA_TYPES.GIF,
      src: '/help-assets/using-dashboard.gif',
      title: 'Dashboard walkthrough',
    },
    sections: [
      {
        type: HELP_SECTION_TYPES.PARAGRAPH,
        body: 'The dashboard gives a high-level view of testing progress, open work, blocked controls, DAT and OET distribution, and team capacity.',
      },
      {
        type: HELP_SECTION_TYPES.TIP,
        body: 'Use Refresh when you want the latest dashboard data after making changes in Tracker.',
      },
    ],
  },
  {
    id: 'finding-controls',
    title: 'Finding Controls',
    categoryId: 'controls',
    order: 10,
    summary: 'Search and review active or retired controls in the catalog.',
    roles: [ROLES.MANAGER, ROLES.TESTER],
    permissions: [ACTIONS.VIEW_CONTROLS],
    keywords: ['catalog', 'controls', 'search controls', 'vgcpid', 'control owner', 'sme'],
    media: {
      type: HELP_MEDIA_TYPES.VIDEO,
      src: '/help-assets/finding-controls.mp4',
      poster: '/help-assets/finding-controls-poster.png',
      title: 'Finding controls walkthrough',
    },
    sections: [
      {
        type: HELP_SECTION_TYPES.STEPS,
        title: 'Find a control',
        items: [
          'Open Catalog from the top navigation.',
          'Use the search bar to find a control by VGCPID, owner, SME, or description.',
          'Open a control row to review metadata, test history, and request history.',
        ],
      },
      {
        type: HELP_SECTION_TYPES.TIP,
        body: 'Search works best with specific identifiers like VGCPID values or owner names.',
      },
    ],
  },
  {
    id: 'creating-controls',
    title: 'Creating Controls',
    categoryId: 'controls',
    order: 20,
    summary: 'Create a new control record from the catalog.',
    roles: [ROLES.MANAGER],
    permissions: [ACTIONS.CREATE_CONTROL],
    keywords: ['create control', 'new control', 'add control', 'catalog', 'vgcpid'],
    media: {
      type: HELP_MEDIA_TYPES.VIDEO,
      src: '/help-assets/creating-controls.mp4',
      poster: '/help-assets/creating-controls-poster.png',
      title: 'Creating controls walkthrough',
    },
    sections: [
      {
        type: HELP_SECTION_TYPES.STEPS,
        title: 'Create a control',
        items: [
          'Open Catalog.',
          'Select Add Control.',
          'Enter the control ID, description, owner, SME, and escalation details.',
          'Submit the form.',
        ],
      },
      {
        type: HELP_SECTION_TYPES.PERMISSION,
        action: ACTIONS.CREATE_CONTROL,
        body: 'Only managers can create controls.',
      },
    ],
  },
  {
    id: 'creating-requests',
    title: 'Creating Requests',
    categoryId: 'requests',
    order: 10,
    summary: 'Create a request so testing work can be assigned and tracked.',
    roles: [ROLES.MANAGER],
    permissions: [ACTIONS.CREATE_REQUEST, ACTIONS.ASSIGN_TESTER_TO_REQUEST],
    keywords: ['create request', 'new request', 'add request', 'assign tester', 'request status'],
    media: {
      type: HELP_MEDIA_TYPES.VIDEO,
      src: '/help-assets/creating-requests.mp4',
      poster: '/help-assets/creating-requests-poster.png',
      title: 'Creating requests walkthrough',
    },
    sections: [
      {
        type: HELP_SECTION_TYPES.STEPS,
        title: 'Create a request',
        items: [
          'Open Tracker.',
          'Select the Requests tab.',
          'Select Add Request.',
          'Fill out priority, requestor, due date, and description.',
          'Submit the request.',
        ],
      },
      {
        type: HELP_SECTION_TYPES.PERMISSION,
        action: ACTIONS.CREATE_REQUEST,
        body: 'Only managers can create requests.',
      },
      {
        type: HELP_SECTION_TYPES.WARNING,
        body: 'Requests should include enough detail for testers to understand the requested control work.',
      },
    ],
  },
  {
    id: 'working-tests',
    title: 'Working Tests',
    categoryId: 'testing',
    order: 10,
    summary: 'Review assigned tests, update testing progress, and add evidence links.',
    roles: [ROLES.MANAGER, ROLES.TESTER],
    permissions: [ACTIONS.VIEW_TESTS, ACTIONS.UPDATE_TEST, ACTIONS.COMMENT],
    keywords: ['tests', 'controls tracker', 'assigned tests', 'evidence', 'comments', 'status'],
    media: {
      type: HELP_MEDIA_TYPES.GIF,
      src: '/help-assets/working-tests.gif',
      title: 'Working tests walkthrough',
    },
    sections: [
      {
        type: HELP_SECTION_TYPES.STEPS,
        title: 'Update a test',
        items: [
          'Open Tracker.',
          'Select the Controls tab.',
          'Open the test details.',
          'Update progress, comments, or evidence links as needed.',
        ],
      },
      {
        type: HELP_SECTION_TYPES.TIP,
        body: 'Use comments to preserve review context when testing status changes.',
      },
    ],
  },
  {
    id: 'understanding-rbac',
    title: 'Understanding Permissions',
    categoryId: 'admin',
    order: 10,
    summary: 'Understand what managers and testers can do in the application.',
    roles: [ROLES.MANAGER, ROLES.TESTER],
    permissions: [],
    keywords: ['rbac', 'roles', 'manager', 'tester', 'permissions', 'restricted actions'],
    media: null,
    sections: [
      {
        type: HELP_SECTION_TYPES.PARAGRAPH,
        body: 'Permissions are based on Cognito groups. Managers can perform administrative actions. Testers can view work, update tests, comment, export summaries, and review version history.',
      },
      {
        type: HELP_SECTION_TYPES.WARNING,
        body: 'If an action appears disabled, your current role probably does not include that permission.',
      },
    ],
  },
];

export function getHelpCategoryById(categoryId) {
  return HELP_CATEGORIES.find((category) => category.id === categoryId) || null;
}

export function sortHelpCategories(categories = HELP_CATEGORIES) {
  return [...categories].sort((left, right) => left.order - right.order);
}

export function sortHelpDocs(docs = HELP_DOCS) {
  return [...docs].sort((left, right) => {
    if (left.categoryId !== right.categoryId) {
      const leftCategory = getHelpCategoryById(left.categoryId);
      const rightCategory = getHelpCategoryById(right.categoryId);
      return (leftCategory?.order ?? 0) - (rightCategory?.order ?? 0);
    }

    return left.order - right.order;
  });
}

export function getHelpDocsByCategory(categoryId, docs = HELP_DOCS) {
  return sortHelpDocs(docs).filter((doc) => doc.categoryId === categoryId);
}
