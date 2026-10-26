"use client";

import type { SectionScreens } from "./types";
import {
  FilingsDocketScreen,
  FormPrFileScreen,
  FormPrIssuesScreen,
  FormPrReviewScreen,
} from "./filings/review-screens";

export const filingsScreens: SectionScreens = {
  review: { Component: FormPrReviewScreen },
  validation: { Component: FormPrIssuesScreen },
  file: { Component: FormPrFileScreen },
  docket: { Component: FilingsDocketScreen },
};
