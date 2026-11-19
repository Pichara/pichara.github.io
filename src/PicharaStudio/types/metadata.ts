/**
 * DiagramMetadata — Information about the diagram file itself.
 *
 * This data is not visual — it describes when the diagram was created,
 * its schema version, and optional authorship information.
 */

export interface DiagramMetadata {
  /**
   * When the diagram was first created.
   * ISO 8601 string (e.g. "2026-11-18T19:00:00.000Z").
   */
  createdAt: string;

  /**
   * When the diagram was last modified.
   * ISO 8601 string.
   */
  updatedAt: string;

  /**
   * Schema version for the diagram data format.
   * Follows semver (e.g. "1.0.0").
   * Used for future migrations if the data model evolves.
   */
  version: string;

  /** Optional author name. */
  author?: string;

  /** Optional classification tags (e.g. ["architecture", "payment"]). */
  tags?: string[];
}
