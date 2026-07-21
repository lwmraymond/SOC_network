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

/**
 * Parent-owned workflows are added only after their source and parent entry are
 * GitHub-saved. H01 intentionally shares P12's canonical Asset Detail route.
 */
export const workflowSpecs: WorkflowSpec[] = [
  {
    id: 'H01',
    title: 'Asset Detail',
    route: '/devices/assets/:assetId',
    parent: 'Asset 360',
    surface: 'Full-page entity detail',
    objective: 'Verify asset identity, provenance, telemetry, exposure, security activity, relationships and ITSM configuration context before a governed action.',
    actions: [
      'Request response action',
      'Create or attach Case',
      'Create ITSM Incident',
      'Create Change',
      'Submit identity / CMDB correction',
    ],
    boundary: 'The Asset is the security investigation anchor; the ITSM CI remains authoritative for CI-owned configuration fields and the Service remains a separate impact object.',
  },
];
