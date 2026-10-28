// The additive table. THE RULE: no source, no statement.
//
// - Every statement carries at least one source, and every source has the date it was checked.
// - We describe what a regulator or expert body said, with who and when. We never write a verdict.
// - A fact we could not source is left out. An empty list is correct; an unsourced sentence is not.
// - No brand names.
// additive-table.test.ts enforces these rules, so an entry that breaks them fails the tests.

export type Source = {
  title: string;
  url: string;
  /** The day we read the source, as YYYY-MM-DD. */
  checkedOn: string;
};

export type Statement = {
  text: string;
  sources: Source[];
};

export type AdditiveEntry = {
  /** Written form from normalizeCode, for example "415" or "160c(i)". */
  code: string;
  name: string;
  /** Short group name for the card header. */
  group: string;
  /** What it does in food. */
  purpose: Statement;
  /** What regulators say: permission in India, expert limits. */
  rules: Statement[];
  /** Documented findings worth knowing. Often empty: only sourced facts belong here. */
  awareness: Statement[];
};

const CHECKED = "2026-10-28";

function jecfa(title: string, url: string, checkedOn = CHECKED): Source {
  return { title: `WHO JECFA: ${title}`, url, checkedOn };
}
function efsa(title: string, url: string, checkedOn = CHECKED): Source {
  return { title: `EFSA: ${title}`, url, checkedOn };
}

const JECFA_DB = "https://apps.who.int/food-additives-contaminants-jecfa-database";

const FSSAI_LIST: Source = {
  title: "FSSAI: Appendix A, List of Food Additives (revision of 30 December 2011)",
  url: "https://fssai.gov.in/upload/uploadfiles/files/appendix_a_and_b_revised(30-12-2011).pdf",
  checkedOn: CHECKED,
};

const EU_COLOUR_WARNING: Source = {
  title: "CMS legal update: compulsory warnings on colours in food and drink (EU Regulation 1333/2008)",
  url: "https://cms.law/en/gbr/legal-updates/compulsory-warnings-on-colours-in-food-and-drink",
  checkedOn: CHECKED,
};

const INDIA_NOTE = "Later amendments were not checked.";

function indiaListed(listedAs: string): Statement {
  return {
    text: `Listed in FSSAI's list of food additives as ${listedAs}. ${INDIA_NOTE}`,
    sources: [FSSAI_LIST],
  };
}

export const ADDITIVES: AdditiveEntry[] = [
  {
    code: "1442",
    name: "Hydroxypropyl distarch phosphate",
    group: "Thickener (modified starch)",
    purpose: {
      text: "A modified starch used as an emulsifier, stabiliser and thickener.",
      sources: [jecfa("hydroxypropyl distarch phosphate", `${JECFA_DB}/chemical.aspx?chemID=2343`)],
    },
    rules: [
      {
        text: "JECFA lists the acceptable daily intake as \"not specified\" (evaluation of 2016).",
        sources: [jecfa("hydroxypropyl distarch phosphate", `${JECFA_DB}/chemical.aspx?chemID=2343`)],
      },
      indiaListed("a modified starch"),
    ],
    awareness: [],
  },
  {
    code: "1422",
    name: "Acetylated distarch adipate",
    group: "Thickener (modified starch)",
    purpose: {
      text: "A modified starch used as an emulsifier, stabiliser and thickener.",
      sources: [jecfa("acetylated distarch adipate", `${JECFA_DB}/Home/Chemical/78`)],
    },
    rules: [
      {
        text: "JECFA lists the acceptable daily intake as \"not specified\" (evaluation of 2016).",
        sources: [jecfa("acetylated distarch adipate", `${JECFA_DB}/Home/Chemical/78`)],
      },
      indiaListed("a modified starch"),
    ],
    awareness: [],
  },
  {
    code: "1450",
    name: "Starch sodium octenyl succinate",
    group: "Thickener (modified starch)",
    purpose: {
      text: "A modified starch used as an emulsifier, stabiliser and thickener.",
      sources: [jecfa("starch sodium octenylsuccinate", `${JECFA_DB}/chemical.aspx?chemID=340`)],
    },
    rules: [
      {
        text: "JECFA lists the acceptable daily intake as \"not specified\" (evaluation of 2016).",
        sources: [jecfa("starch sodium octenylsuccinate", `${JECFA_DB}/chemical.aspx?chemID=340`)],
      },
    ],
    awareness: [],
  },
  {
    code: "415",
    name: "Xanthan gum",
    group: "Thickener",
    purpose: {
      text: "A thickening agent.",
      sources: [FSSAI_LIST],
    },
    rules: [
      indiaListed("a thickening agent"),
      {
        text: "EFSA concluded in 2017 that there is no need for a numerical acceptable daily intake for xanthan gum.",
        sources: [efsa("re-evaluation of xanthan gum (E 415)", "https://efsa.europa.eu/en/efsajournal/pub/4909")],
      },
    ],
    awareness: [
      {
        text: "In a ten-day study in adults, at up to 214 mg per kg of body weight a day, some people had abdominal discomfort. EFSA described this as an undesirable but not adverse effect.",
        sources: [efsa("re-evaluation of xanthan gum (E 415)", "https://efsa.europa.eu/en/efsajournal/pub/4909")],
      },
    ],
  },
  {
    code: "330",
    name: "Citric acid",
    group: "Acidity regulator",
    purpose: {
      text: "An acidity regulator.",
      sources: [FSSAI_LIST],
    },
    rules: [
      indiaListed("an acidity regulator"),
      {
        text: "JECFA set a group acceptable daily intake of \"not limited\" for citric acid and its calcium, potassium, sodium and ammonium salts (1973).",
        sources: [jecfa("citric acid", "https://www.inchem.org/documents/jecfa/jeceval/jec_436.htm")],
      },
    ],
    awareness: [],
  },
  {
    code: "260",
    name: "Acetic acid",
    group: "Acidity regulator",
    purpose: {
      text: "An acidity regulator.",
      sources: [FSSAI_LIST],
    },
    rules: [
      indiaListed("an acidity regulator"),
      {
        text: "JECFA set a group acceptable daily intake of \"not limited\" for acetic acid and its potassium and sodium salts (1973, kept in 1997).",
        sources: [jecfa("acetic acid", "https://www.inchem.org/documents/jecfa/jeceval/jec_10.htm")],
      },
    ],
    awareness: [],
  },
  {
    code: "211",
    name: "Sodium benzoate",
    group: "Preservative",
    purpose: {
      text: "A preservative.",
      sources: [FSSAI_LIST],
    },
    rules: [
      indiaListed("a preservative (benzoic acid and its sodium and potassium salts)"),
      {
        text: "JECFA's acceptable daily intake for benzoates is 0 to 20 mg per kg of body weight, as benzoic acid (2021).",
        sources: [jecfa("benzoates", `${JECFA_DB}/Home/Chemical/1227`)],
      },
      {
        text: "EFSA's acceptable daily intake is lower: 5 mg per kg of body weight a day, as benzoic acid (2016).",
        sources: [efsa("re-evaluation of benzoic acid and benzoates (E 210-213)", "https://efsa.europa.eu/en/efsajournal/pub/4433")],
      },
    ],
    awareness: [
      {
        text: "EFSA estimated that intake from all sources could go above its acceptable daily intake for toddlers and children in some scenarios. Flavoured drinks and some unprocessed fruit and vegetables were the main contributors.",
        sources: [efsa("re-evaluation of benzoic acid and benzoates (E 210-213)", "https://efsa.europa.eu/en/efsajournal/pub/4433")],
      },
    ],
  },
  {
    code: "202",
    name: "Potassium sorbate",
    group: "Preservative",
    purpose: {
      text: "A preservative.",
      sources: [jecfa("potassium sorbate", `${JECFA_DB}/Home/Chemical/2724`)],
    },
    rules: [
      indiaListed("a preservative (sorbic acid and its sodium, potassium and calcium salts)"),
      {
        text: "JECFA's group acceptable daily intake is 0 to 25 mg per kg of body weight, for sorbic acid and its calcium, potassium and sodium salts together, as sorbic acid (1973).",
        sources: [jecfa("potassium sorbate", `${JECFA_DB}/Home/Chemical/2724`)],
      },
    ],
    awareness: [],
  },
  {
    code: "635",
    name: "Disodium 5'-ribonucleotides",
    group: "Flavour enhancer",
    purpose: {
      text: "A flavour enhancer.",
      sources: [jecfa("disodium 5'-ribonucleotides", `${JECFA_DB}/chemical.aspx?chemID=4140`)],
    },
    rules: [
      {
        text: "JECFA lists the acceptable daily intake as \"not specified\" (evaluation of 1974).",
        sources: [jecfa("disodium 5'-ribonucleotides", `${JECFA_DB}/chemical.aspx?chemID=4140`)],
      },
    ],
    awareness: [],
  },
  {
    code: "551",
    name: "Silicon dioxide",
    group: "Anticaking agent",
    purpose: {
      text: "An anticaking agent.",
      sources: [FSSAI_LIST],
    },
    rules: [indiaListed("an anticaking agent")],
    awareness: [
      {
        text: "In its 2018 re-evaluation, EFSA found no indication of toxicity at the reported uses and use levels. It could not confirm the earlier group acceptable daily intake of \"not specified\", and said the EU specifications did not describe the additive well enough, including its particle size.",
        sources: [efsa("re-evaluation of silicon dioxide (E 551)", "https://efsa.europa.eu/en/efsajournal/pub/5088")],
      },
    ],
  },
  {
    code: "319",
    name: "Tertiary butylhydroquinone (TBHQ)",
    group: "Antioxidant",
    purpose: {
      text: "An antioxidant.",
      sources: [jecfa("tertiary butylhydroquinone", `${JECFA_DB}/Home/Chemical/236`)],
    },
    rules: [
      indiaListed("an antioxidant"),
      {
        text: "JECFA's acceptable daily intake is 0 to 0.7 mg per kg of body weight (1997).",
        sources: [jecfa("tertiary butylhydroquinone", `${JECFA_DB}/Home/Chemical/236`)],
      },
    ],
    awareness: [],
  },
  {
    code: "385",
    name: "Calcium disodium EDTA",
    group: "Sequestrant",
    purpose: {
      text: "A sequestrant, which binds metals, and a preservative.",
      sources: [jecfa("calcium disodium EDTA", `${JECFA_DB}/Home/Chemical/3011`)],
    },
    rules: [
      indiaListed("a sequestering agent"),
      {
        text: "JECFA's acceptable daily intake is 0 to 2.5 mg per kg of body weight (1973).",
        sources: [jecfa("calcium disodium EDTA", `${JECFA_DB}/Home/Chemical/3011`)],
      },
    ],
    awareness: [],
  },
  {
    code: "160c(i)",
    name: "Paprika colour",
    group: "Colour (natural)",
    purpose: {
      text: "A colour made from paprika.",
      sources: [jecfa("paprika oleoresin", "https://inchem.org/documents/jecfa/jeceval/jec_1820.htm")],
    },
    rules: [
      {
        text: "JECFA lists paprika oleoresin (INS 160c) as \"acceptable\" without a numerical limit, based on a 1970 opinion that its use as a spice limits how much is eaten.",
        sources: [jecfa("paprika oleoresin", "https://inchem.org/documents/jecfa/jeceval/jec_1820.htm")],
      },
    ],
    awareness: [],
  },
  {
    code: "122",
    name: "Carmoisine (azorubine)",
    group: "Colour (synthetic)",
    purpose: {
      text: "A synthetic colour.",
      sources: [FSSAI_LIST],
    },
    rules: [
      indiaListed("a synthetic colour"),
      {
        text: "The acceptable daily intake is 4 mg per kg of body weight a day. EFSA kept it after its re-evaluation (2009); JECFA set it in 1983.",
        sources: [efsa("re-evaluation of azorubine/carmoisine (E 122)", "https://efsa.europa.eu/en/efsajournal/pub/1332")],
      },
      {
        text: "In the EU, food containing carmoisine (E122) must carry the warning that it \"may have an adverse effect on activity and attention in children\". India's list above does not say this.",
        sources: [EU_COLOUR_WARNING],
      },
    ],
    awareness: [],
  },
  {
    code: "460(i)",
    name: "Microcrystalline cellulose",
    group: "Stabiliser and emulsifier",
    purpose: {
      text: "Used as an anticaking agent, an emulsifier and a stabiliser.",
      sources: [jecfa("microcrystalline cellulose", `${JECFA_DB}/Home/Chemical/281`)],
    },
    rules: [
      {
        text: "JECFA's acceptable daily intake is \"not specified\" (evaluated 1997).",
        sources: [jecfa("microcrystalline cellulose", `${JECFA_DB}/Home/Chemical/281`)],
      },
      {
        text: "In its 2018 re-evaluation of celluloses (E 460 to E 469), EFSA found no need for a numerical acceptable daily intake, and no safety concern at the reported uses and use levels.",
        sources: [efsa("re-evaluation of celluloses E 460 to E 469", "https://efsa.europa.eu/en/efsajournal/pub/5047")],
      },
    ],
    awareness: [],
  },
  {
    code: "553(iii)",
    name: "Talc",
    group: "Anticaking agent",
    purpose: {
      text: "Used as an anticaking agent. JECFA also lists it as a coating agent, a filtering aid and a surface-finishing agent.",
      sources: [jecfa("talc", "https://inchem.org/documents/jecfa/jeceval/jec_2221.htm")],
    },
    rules: [
      {
        text: "JECFA's acceptable daily intake is \"not specified\" (evaluated 1986).",
        sources: [jecfa("talc", "https://inchem.org/documents/jecfa/jeceval/jec_2221.htm")],
      },
    ],
    awareness: [
      {
        text: "In its 2018 re-evaluation of silicates, EFSA (which calls talc E 553b) concluded that the safety of talc as a food additive \"cannot be assessed\", because reliable long-term toxicity, cancer and reproductive data were missing. It also noted that absorption was very low and that there was no indication of genotoxicity or developmental toxicity.",
        sources: [efsa("re-evaluation of calcium silicate, magnesium silicates and talc (E 552, E 553a, E 553b)", "https://efsa.europa.eu/en/efsajournal/pub/5375")],
      },
    ],
  },
  {
    code: "1201",
    name: "Polyvinylpyrrolidone (PVP)",
    group: "Stabiliser and bodying agent",
    purpose: {
      text: "Used as a bodying agent, a stabiliser, a clarifying agent, a dispersing agent and an aid in making tablets.",
      sources: [jecfa("polyvinylpyrrolidone", "https://inchem.org/documents/jecfa/jeceval/jec_1957.htm")],
    },
    rules: [
      {
        text: "JECFA's acceptable daily intake is 0 to 50 mg per kg of body weight (1986).",
        sources: [jecfa("polyvinylpyrrolidone", "https://inchem.org/documents/jecfa/jeceval/jec_1957.htm")],
      },
      {
        text: "In its 2020 re-evaluation, EFSA found no need for a numerical acceptable daily intake for polyvinylpyrrolidone (E 1201) and no safety concern at the reported uses and use levels.",
        sources: [efsa("re-evaluation of polyvinylpyrrolidone (E 1201) and polyvinylpolypyrrolidone (E 1202)", "https://doi.org/10.2903/j.efsa.2020.6215")],
      },
    ],
    awareness: [],
  },
];

const BY_CODE = new Map(ADDITIVES.map((entry) => [entry.code, entry]));

/** The entry for a code written by normalizeCode, or null when we have no sourced information. */
export function lookupAdditive(code: string): AdditiveEntry | null {
  return BY_CODE.get(code) ?? null;
}

export type FoundAdditive = { code: string; entry: AdditiveEntry | null };
