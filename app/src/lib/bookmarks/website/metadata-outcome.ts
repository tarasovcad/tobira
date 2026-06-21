export type WebsiteMetadataOutcome =
  | {
      status: "completed";
      title?: string;
      description?: string;
      websiteProtected: false;
    }
  | {
      status: "protected";
      websiteProtected: true;
    }
  | {
      status: "unreachable";
      websiteProtected: false;
    };

export type WebsiteTextMetadataStatus = "completed" | "processing" | "failed";

export type WebsiteMetadataState = {
  title: string | null;
  description: string | null;
  textMetadataStatus: WebsiteTextMetadataStatus;
  websiteProtected: boolean;
  shouldQueueEnrichment: boolean;
  metadata: {
    textMetadataStatus: WebsiteTextMetadataStatus;
    websiteProtected: boolean;
  };
};

export function resolveWebsiteMetadataState(outcome: WebsiteMetadataOutcome): WebsiteMetadataState {
  const title = outcome.status === "completed" ? (outcome.title ?? null) : null;
  const description = outcome.status === "completed" ? (outcome.description ?? null) : null;
  const textMetadataStatus =
    outcome.status === "completed"
      ? "completed"
      : outcome.status === "protected"
        ? "processing"
        : "failed";

  return {
    title,
    description,
    textMetadataStatus,
    websiteProtected: outcome.websiteProtected,
    shouldQueueEnrichment: outcome.status !== "unreachable",
    metadata: {
      textMetadataStatus,
      websiteProtected: outcome.websiteProtected,
    },
  };
}
