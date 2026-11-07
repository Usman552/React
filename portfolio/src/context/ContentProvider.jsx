"use client";

import { ContentContext } from "./content";

/**
 * Makes the server-loaded content available to client components.
 * Content is fetched on the server (see loadPublicContent), so the HTML
 * already contains it and there is no loading flash.
 */
export default function ContentProvider({ content, children }) {
  return <ContentContext.Provider value={content}>{children}</ContentContext.Provider>;
}
