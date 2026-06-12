// Single source of truth for all site copy. Edit the prose in `content.json`;
// every component reads from this typed re-export. See content.json `_README`.
import data from "./content.json";

export const content = data;
export default content;
