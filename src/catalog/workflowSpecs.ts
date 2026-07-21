export type WorkflowSpec = {
  id: string;
  title: string;
  route: string;
  parent: string;
  surface: string;
  objective: string;
  actions: string[];
  boundary: string;
};

// P01–P22 temporary review build does not expose parent-owned workflow routes.
export const workflowSpecs: WorkflowSpec[] = [];
