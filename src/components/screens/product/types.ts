export interface SectionScreen {
  Component: () => React.JSX.Element;
  /** A phone screen: drawn in its own device frame beside the copy, not full width. */
  phone?: boolean;
}

/** One product page's section screens, keyed by `ProductSection.screen`. */
export type SectionScreens = Record<string, SectionScreen>;
