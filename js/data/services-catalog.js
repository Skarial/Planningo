/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

// =======================
// CATALOGUE DES SERVICES
// =======================

export const SERVICES_CATALOG = [
  {
    code: "REPOS",
    type: "REPOS",
    periodes: [],
  },
  {
    code: "TEST-ALARM",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "16:45", fin: "17:00" }],
      },
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "16:45", fin: "17:00" }],
      },
    ],
  },
  {
    code: "DM",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "05:45", fin: "13:00" }],
      },
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "05:45", fin: "13:00" }],
      },
    ],
  },
  {
    code: "DAM",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "12:30", fin: "20:00" }],
      },
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "12:30", fin: "20:00" }],
      },
    ],
  },
  {
    code: "TAD 1",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "06:45", fin: "13:15" }],
      },
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "06:45", fin: "13:15" }],
      },
    ],
  },
  {
    code: "TAD 2",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "13:00", fin: "20:15" }],
      },
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "13:00", fin: "20:15" }],
      },
    ],
  },
  {
    code: "TAD 3",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "06:45", fin: "13:15" }],
      },
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "06:45", fin: "13:15" }],
      },
    ],
  },
  {
    code: "TAD 4",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "13:00", fin: "20:15" }],
      },
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "13:00", fin: "20:15" }],
      },
    ],
  },
  {
    code: "TAD 5",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "06:45", fin: "13:15" }],
      },
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "06:45", fin: "13:15" }],
      },
    ],
  },
  {
    code: "TAD 6",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "13:00", fin: "20:15" }],
      },
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "13:00", fin: "20:15" }],
      },
    ],
  },
  {
    code: "2001",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "07:25", fin: "13:05" }],
      },
    ],
  },
  {
    code: "2002",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "13:08", fin: "19:38" }],
      },
    ],
  },
  {
    code: "2004",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "13:06", fin: "19:52" }],
      },
    ],
  },
  {
    code: "2005",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "07:07", fin: "13:08" }],
      },
    ],
  },
  {
    code: "2006",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "13:10", fin: "19:57" }],
      },
    ],
  },
  {
    code: "2008",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "13:14", fin: "19:43" }],
      },
    ],
  },
  {
    code: "2011",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "07:13", fin: "13:08" }],
      },
    ],
  },
  {
    code: "2012",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "13:10", fin: "19:29" }],
      },
    ],
  },
  {
    code: "2013",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "07:14", fin: "13:19" }],
      },
    ],
  },
  {
    code: "2014",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "13:19", fin: "19:45" }],
      },
    ],
  },

  /* ===== SERVICES SAISONNIERS UNIQUEMENT ===== */

  {
    code: "2021",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "07:37", fin: "12:48" }],
      },
    ],
  },
  {
    code: "2022",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "13:13", fin: "19:38" }],
      },
    ],
  },
  {
    code: "2024",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "13:09", fin: "19:52" }],
      },
    ],
  },
  {
    code: "2031",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "07:23", fin: "13:04" }],
      },
    ],
  },
  {
    code: "2032",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "13:13", fin: "19:38" }],
      },
    ],
  },
  {
    code: "2033",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "07:37", fin: "12:48" }],
      },
    ],
  },
  {
    code: "2034",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "13:09", fin: "19:52" }],
      },
    ],
  },
  {
    code: "2101",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [
          { debut: "06:43", fin: "09:50" },
          { debut: "11:45", fin: "13:57" },
        ],
      },
    ],
  },
  {
    code: "2102",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "12:40", fin: "20:40" }],
      },
    ],
  },
  {
    code: "2103",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "06:25", fin: "13:08" }],
      },
    ],
  },
  {
    code: "2104",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "13:01", fin: "20:37" }],
      },
    ],
  },
  {
    code: "2105",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "06:38", fin: "13:29" }],
      },
    ],
  },
  {
    code: "2106",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "13:18", fin: "20:22" }],
      },
    ],
  },
  {
    code: "2107",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "06:53", fin: "13:46" }],
      },
    ],
  },
  {
    code: "2108",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [
          { debut: "12:15", fin: "14:43" },
          { debut: "15:30", fin: "18:55" },
        ],
      },
    ],
  },
  {
    code: "2111",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "06:28", fin: "13:16" }],
      },
    ],
  },
  {
    code: "2112",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "12:48", fin: "20:42" }],
      },
    ],
  },
  {
    code: "2113",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "06:38", fin: "13:53" }],
      },
    ],
  },
  {
    code: "2114",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "13:25", fin: "20:41" }],
      },
    ],
  },

  /* ===== SERVICES SAISONNIERS UNIQUEMENT ===== */

  {
    code: "2121",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "06:28", fin: "13:21" }],
      },
    ],
  },
  {
    code: "2122",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "12:53", fin: "20:42" }],
      },
    ],
  },
  {
    code: "2123",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "06:38", fin: "13:56" }],
      },
    ],
  },
  {
    code: "2124",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "13:28", fin: "20:41" }],
      },
    ],
  },
  {
    code: "2201",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "05:55", fin: "13:07" }],
      },
    ],
  },
  {
    code: "2202",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "13:16", fin: "20:13" }],
      },
    ],
  },
  {
    code: "2203",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "06:08", fin: "13:00" }],
      },
    ],
  },
  {
    code: "2204",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "12:39", fin: "20:21" }],
      },
    ],
  },
  {
    code: "2205",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "06:23", fin: "13:06" }],
      },
    ],
  },
  {
    code: "2206",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "12:23", fin: "19:54" }],
      },
    ],
  },
  {
    code: "2207",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "06:36", fin: "13:50" }],
      },
    ],
  },
  {
    code: "2208",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "13:12", fin: "20:32" }],
      },
    ],
  },
  {
    code: "2209",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "06:38", fin: "13:49" }],
      },
    ],
  },
  {
    code: "2210",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "13:46", fin: "20:38" }],
      },
    ],
  },
  {
    code: "2211",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "06:50", fin: "13:10" }],
      },
    ],
  },
  {
    code: "2212",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "12:32", fin: "19:54" }],
      },
    ],
  },
  {
    code: "2213",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "07:04", fin: "13:52" }],
      },
    ],
  },
  {
    code: "2214",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "13:24", fin: "20:07" }],
      },
    ],
  },
  {
    code: "2215",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "07:18", fin: "13:34" }],
      },
    ],
  },
  {
    code: "2216",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "12:51", fin: "20:18" }],
      },
    ],
  },
  {
    code: "2217",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "06:06", fin: "13:59" }],
      },
    ],
  },
  {
    code: "2218",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "13:16", fin: "20:34" }],
      },
    ],
  },
  {
    code: "2219",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "06:12", fin: "13:40" }],
      },
    ],
  },
  {
    code: "2220",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "13:12", fin: "20:37" }],
      },
    ],
  },
  {
    code: "2221",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "06:23", fin: "13:03" }],
      },
    ],
  },
  {
    code: "2222",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "12:35", fin: "20:03" }],
      },
    ],
  },
  {
    code: "2223",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "06:31", fin: "13:25" }],
      },
    ],
  },
  {
    code: "2224",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "12:42", fin: "19:58" }],
      },
    ],
  },
  {
    code: "2225",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "06:41", fin: "13:44" }],
      },
    ],
  },
  {
    code: "2226",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "13:06", fin: "20:17" }],
      },
    ],
  },
  {
    code: "2227",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "06:43", fin: "13:05" }],
      },
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "06:12", fin: "13:41" }],
      },
    ],
  },
  {
    code: "2228",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "12:41", fin: "20:19" }],
      },
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "13:13", fin: "20:37" }],
      },
    ],
  },
  {
    code: "2229",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "06:06", fin: "13:14" }],
      },
    ],
  },
  {
    code: "2230",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "12:36", fin: "20:34" }],
      },
    ],
  },
  {
    code: "2231",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "06:31", fin: "13:28" }],
      },
    ],
  },
  {
    code: "2232",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "12:45", fin: "19:58" }],
      },
    ],
  },
  {
    code: "2233",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "06:23", fin: "13:04" }],
      },
    ],
  },
  {
    code: "2234",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "12:36", fin: "20:03" }],
      },
    ],
  },
  {
    code: "2235",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "06:43", fin: "13:44" }],
      },
    ],
  },
  {
    code: "2236",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "13:01", fin: "20:19" }],
      },
    ],
  },
  {
    code: "2237",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "06:41", fin: "13:46" }],
      },
    ],
  },
  {
    code: "2238",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "13:08", fin: "20:17" }],
      },
    ],
  },
  {
    code: "2241",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "06:11", fin: "13:33" }],
      },
    ],
  },
  {
    code: "2242",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "12:55", fin: "20:22" }],
      },
    ],
  },
  {
    code: "2243",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "06:18", fin: "13:30" }],
      },
    ],
  },
  {
    code: "2244",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "12:47", fin: "20:20" }],
      },
    ],
  },
  {
    code: "2245",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "06:41", fin: "14:01" }],
      },
    ],
  },
  {
    code: "2246",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "13:23", fin: "20:46" }],
      },
    ],
  },
  {
    code: "2247",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "06:43", fin: "13:58" }],
      },
    ],
  },
  {
    code: "2248",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "13:15", fin: "20:48" }],
      },
    ],
  },
  {
    code: "2301",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "05:33", fin: "12:28" }],
      },
    ],
  },
  {
    code: "2302",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "12:00", fin: "19:42" }],
      },
    ],
  },
  {
    code: "2303",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [
          { debut: "06:13", fin: "09:55" },
          { debut: "11:45", fin: "14:30" },
        ],
      },
    ],
  },
  {
    code: "2304",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "12:30", fin: "19:54" }],
      },
    ],
  },
  {
    code: "2305",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "06:28", fin: "12:27" }],
      },
    ],
  },
  {
    code: "2306",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [
          { debut: "12:09", fin: "14:40" },
          { debut: "15:30", fin: "19:51" },
        ],
      },
    ],
  },
  {
    code: "2311",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "05:33", fin: "12:41" }],
      },
    ],
  },
  {
    code: "2312",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "12:38", fin: "20:12" }],
      },
    ],
  },
  {
    code: "2321",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "05:33", fin: "12:11" }],
      },
    ],
  },
  {
    code: "2322",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "12:16", fin: "19:42" }],
      },
    ],
  },
  {
    code: "2323",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "06:42", fin: "12:27" }],
      },
    ],
  },
  {
    code: "2324",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "12:30", fin: "19:54" }],
      },
    ],
  },
  {
    code: "2331",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "05:33", fin: "12:36" }],
      },
    ],
  },
  {
    code: "2332",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "12:38", fin: "20:12" }],
      },
    ],
  },
  {
    code: "2401",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "06:58", fin: "13:35" }],
      },
    ],
  },
  {
    code: "2402",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "13:07", fin: "19:56" }],
      },
    ],
  },
  {
    code: "2403",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "06:43", fin: "13:10" }],
      },
    ],
  },
  {
    code: "2404",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "12:42", fin: "20:16" }],
      },
    ],
  },
  {
    code: "2405",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "06:36", fin: "13:58" }],
      },
    ],
  },
  {
    code: "2406",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "13:30", fin: "20:10" }],
      },
    ],
  },
  {
    code: "2407",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "06:56", fin: "13:42" }],
      },
    ],
  },
  {
    code: "2408",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "13:04", fin: "20:26" }],
      },
    ],
  },
  {
    code: "2411",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "07:06", fin: "13:39" }],
      },
    ],
  },
  {
    code: "2412",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "13:01", fin: "20:21" }],
      },
    ],
  },
  {
    code: "2413",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "06:41", fin: "13:49" }],
      },
    ],
  },
  {
    code: "2414",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "13:21", fin: "20:05" }],
      },
    ],
  },
  {
    code: "2415",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "06:48", fin: "13:11" }],
      },
    ],
  },
  {
    code: "2416",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "12:43", fin: "20:13" }],
      },
    ],
  },

  /* ===== SERVICES SAISONNIERS UNIQUEMENT ===== */

  {
    code: "2421",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "06:41", fin: "13:52" }],
      },
    ],
  },
  {
    code: "2422",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "13:24", fin: "20:05" }],
      },
    ],
  },
  {
    code: "2423",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "06:48", fin: "13:19" }],
      },
    ],
  },
  {
    code: "2424",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "12:51", fin: "20:13" }],
      },
    ],
  },
  {
    code: "2425",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "07:06", fin: "13:42" }],
      },
    ],
  },
  {
    code: "2426",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "13:04", fin: "20:21" }],
      },
    ],
  },
  {
    code: "2501",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "05:23", fin: "13:12" }],
      },
    ],
  },
  {
    code: "2502",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "12:48", fin: "20:07" }],
      },
    ],
  },
  {
    code: "2503",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "05:42", fin: "12:16" }],
      },
    ],
  },
  {
    code: "2504",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "13:37", fin: "20:45" }],
      },
    ],
  },
  {
    code: "2505",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "06:40", fin: "14:04" }],
      },
    ],
  },
  {
    code: "2506",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "13:23", fin: "21:10" }],
      },
    ],
  },
  {
    code: "2507",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "06:22", fin: "13:19" }],
      },
    ],
  },
  {
    code: "2509",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [
          { debut: "05:51", fin: "09:42" },
          { debut: "10:19", fin: "12:42" },
        ],
      },
    ],
  },
  {
    code: "2511",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "05:43", fin: "13:37" }],
      },
    ],
  },
  {
    code: "2512",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "12:45", fin: "18:53" }],
      },
    ],
  },
  {
    code: "2513",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "06:40", fin: "13:30" }],
      },
    ],
  },
  {
    code: "2514",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "12:42", fin: "20:48" }],
      },
    ],
  },
  {
    code: "2515",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "08:45", fin: "14:16" }],
      },
    ],
  },
  {
    code: "2516",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "13:44", fin: "19:48" }],
      },
    ],
  },
  {
    code: "2521",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "05:23", fin: "13:21" }],
      },
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "05:23", fin: "13:04" }],
      },
    ],
  },
  {
    code: "2526",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "14:07", fin: "21:10" }],
      },
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "13:37", fin: "20:56" }],
      },
    ],
  },

  /* ===== SERVICES SAISONNIERS UNIQUEMENT ===== */

  {
    code: "2522",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "14:07", fin: "21:10" }],
      },
    ],
  },
  {
    code: "2523",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "05:42", fin: "12:17" }],
      },
    ],
  },
  {
    code: "2524",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "12:48", fin: "20:08" }],
      },
    ],
  },
  {
    code: "2527",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "06:22", fin: "13:15" }],
      },
    ],
  },
  {
    code: "2529",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "06:40", fin: "13:54" }],
      },
    ],
  },
  {
    code: "2531",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "05:43", fin: "13:37" }],
      },
    ],
  },
  {
    code: "2532",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "12:43", fin: "20:48" }],
      },
    ],
  },
  {
    code: "2533",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "06:40", fin: "13:31" }],
      },
    ],
  },
  {
    code: "2534",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "12:45", fin: "18:51" }],
      },
    ],
  },
  {
    code: "2535",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "08:45", fin: "14:16" }],
      },
    ],
  },
  {
    code: "2536",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "13:44", fin: "19:48" }],
      },
    ],
  },
  {
    code: "2601",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "06:43", fin: "13:36" }],
      },
    ],
  },
  {
    code: "2602",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "13:08", fin: "20:18" }],
      },
    ],
  },
  {
    code: "2603",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "06:53", fin: "13:17" }],
      },
    ],
  },
  {
    code: "2604",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "12:49", fin: "20:04" }],
      },
    ],
  },
  {
    code: "2605",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "06:34", fin: "13:32" }],
      },
    ],
  },
  {
    code: "2606",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "13:04", fin: "20:14" }],
      },
    ],
  },
  {
    code: "2611",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "06:43", fin: "13:44" }],
      },
    ],
  },
  {
    code: "2612",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "13:16", fin: "20:22" }],
      },
    ],
  },
  {
    code: "2613",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "06:43", fin: "13:55" }],
      },
    ],
  },
  {
    code: "2614",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "13:27", fin: "20:15" }],
      },
    ],
  },

  /* ===== SERVICES SAISONNIERS UNIQUEMENT ===== */

  {
    code: "2621",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "06:43", fin: "13:49" }],
      },
    ],
  },
  {
    code: "2622",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "13:21", fin: "20:22" }],
      },
    ],
  },
  {
    code: "2624",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "12:56", fin: "20:15" }],
      },
    ],
  },
  {
    code: "2801",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "06:48", fin: "13:47" }],
      },
    ],
  },
  {
    code: "2802",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "13:19", fin: "19:57" }],
      },
    ],
  },
  {
    code: "2803",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "06:53", fin: "13:12" }],
      },
    ],
  },
  {
    code: "2804",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "12:44", fin: "19:58" }],
      },
    ],
  },
  {
    code: "2805",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "05:30", fin: "12:59" }],
      },
    ],
  },
  {
    code: "2806",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [
          { debut: "11:58", fin: "14:10" },
          { debut: "15:30", fin: "18:52" },
        ],
      },
    ],
  },
  {
    code: "2811",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "07:03", fin: "13:42" }],
      },
    ],
  },
  {
    code: "2812",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "13:14", fin: "20:10" }],
      },
    ],
  },
  {
    code: "2813",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "07:28", fin: "13:14" }],
      },
    ],
  },
  {
    code: "2814",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "12:46", fin: "19:45" }],
      },
    ],
  },

  /* ===== SERVICES SAISONNIERS UNIQUEMENT ===== */

  {
    code: "2821",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "06:48", fin: "13:52" }],
      },
    ],
  },
  {
    code: "2822",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "13:24", fin: "20:03" }],
      },
    ],
  },
  {
    code: "2823",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "06:53", fin: "13:17" }],
      },
    ],
  },
  {
    code: "2824",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "12:49", fin: "19:58" }],
      },
    ],
  },
  {
    code: "2831",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "07:03", fin: "13:47" }],
      },
    ],
  },
  {
    code: "2832",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "13:19", fin: "20:11" }],
      },
    ],
  },
  {
    code: "2833",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "07:28", fin: "13:21" }],
      },
    ],
  },
  {
    code: "2834",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "12:53", fin: "19:46" }],
      },
    ],
  },
  {
    code: "2901",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "06:16", fin: "12:16" }],
      },
    ],
  },
  {
    code: "2902",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "14:15", fin: "19:24" }],
      },
    ],
  },
  {
    code: "2903",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "06:48", fin: "13:43" }],
      },
    ],
  },
  {
    code: "2904",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "13:50", fin: "20:57" }],
      },
    ],
  },
  {
    code: "2905",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "05:48", fin: "12:41" }],
      },
    ],
  },
  {
    code: "2906",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "12:44", fin: "19:57" }],
      },
    ],
  },
  {
    code: "2907",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "06:13", fin: "13:11" }],
      },
    ],
  },
  {
    code: "2908",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "13:12", fin: "20:12" }],
      },
    ],
  },
  {
    code: "2910",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "12:30", fin: "20:43" }],
      },
    ],
  },
  {
    code: "2911",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "05:58", fin: "13:07" }],
      },
    ],
  },
  {
    code: "2912",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "12:39", fin: "20:01" }],
      },
    ],
  },
  {
    code: "2913",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "06:12", fin: "13:39" }],
      },
    ],
  },
  {
    code: "2914",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "12:51", fin: "20:39" }],
      },
    ],
  },
  {
    code: "2915",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "06:42", fin: "13:51" }],
      },
    ],
  },
  {
    code: "2916",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "13:23", fin: "20:47" }],
      },
    ],
  },

  /* ===== SERVICES SAISONNIERS UNIQUEMENT ===== */

  {
    code: "2921",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "05:58", fin: "13:10" }],
      },
    ],
  },
  {
    code: "2922",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "12:42", fin: "20:01" }],
      },
    ],
  },
  {
    code: "2923",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "06:12", fin: "13:43" }],
      },
    ],
  },
  {
    code: "2924",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "12:55", fin: "20:38" }],
      },
    ],
  },
  {
    code: "2925",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "06:42", fin: "13:55" }],
      },
    ],
  },
  {
    code: "2926",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "13:27", fin: "20:47" }],
      },
    ],
  },
  {
    code: "3001",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "06:43", fin: "12:57" }],
      },
    ],
  },
  {
    code: "3002",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "12:29", fin: "20:27" }],
      },
    ],
  },
  {
    code: "3003",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "07:13", fin: "13:39" }],
      },
    ],
  },
  {
    code: "3004",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "13:11", fin: "20:02" }],
      },
    ],
  },

  /* ===== SERVICES SAISONNIERS UNIQUEMENT ===== */

  {
    code: "3021",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "06:43", fin: "12:55" }],
      },
    ],
  },
  {
    code: "3022",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "12:27", fin: "20:27" }],
      },
    ],
  },
  {
    code: "3023",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "07:13", fin: "13:42" }],
      },
    ],
  },
  {
    code: "3024",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "13:14", fin: "20:02" }],
      },
    ],
  },
  {
    code: "3026",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période saisonnière",
        plages: [
          { debut: "13:13", fin: "15:37" },
          { debut: "17:40", fin: "20:27" },
        ],
      },
    ],
  },
  {
    code: "3101",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "06:53", fin: "13:22" }],
      },
    ],
  },
  {
    code: "3102",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "13:16", fin: "19:49" }],
      },
    ],
  },
  {
    code: "3111",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "06:58", fin: "13:31" }],
      },
    ],
  },
  {
    code: "3112",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "13:03", fin: "20:09" }],
      },
    ],
  },

  /* ===== SERVICES SAISONNIERS UNIQUEMENT ===== */

  {
    code: "3121",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "06:58", fin: "13:34" }],
      },
    ],
  },
  {
    code: "3122",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "13:06", fin: "20:09" }],
      },
    ],
  },
  {
    code: "3201",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "07:06", fin: "13:37" }],
      },
    ],
  },
  {
    code: "3202",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "13:38", fin: "20:02" }],
      },
    ],
  },

  /* ===== SERVICES SAISONNIERS UNIQUEMENT ===== */

  {
    code: "3221",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "07:06", fin: "13:35" }],
      },
    ],
  },
  {
    code: "3222",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "13:07", fin: "19:45" }],
      },
    ],
  },
  {
    code: "211",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "08:14", fin: "12:45" }],
      },
      {
        libelle: "Période saisonnière",
        plages: [
          { debut: "08:14", fin: "12:38" },
          { debut: "13:46", fin: "18:38" },
        ],
      },
    ],
  },
  {
    code: "213",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [
          { debut: "08:17", fin: "12:36" },
          { debut: "13:46", fin: "18:33" },
        ],
      },
      {
        libelle: "Période saisonnière",
        plages: [
          { debut: "08:17", fin: "12:36" },
          { debut: "13:46", fin: "18:33" },
        ],
      },
    ],
  },
  {
    code: "221",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "08:04", fin: "13:00" }],
      },
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "08:04", fin: "13:00" }],
      },
    ],
  },
  {
    code: "223",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [
          { debut: "08:09", fin: "12:42" },
          { debut: "13:46", fin: "18:39" },
        ],
      },
      {
        libelle: "Période saisonnière",
        plages: [
          { debut: "08:09", fin: "12:42" },
          { debut: "13:46", fin: "18:39" },
        ],
      },
    ],
  },
  {
    code: "251",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [{ debut: "08:05", fin: "12:59" }],
      },
      {
        libelle: "Période saisonnière",
        plages: [{ debut: "08:05", fin: "13:00" }],
      },
    ],
  },
  {
    code: "253",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [
          { debut: "08:25", fin: "12:31" },
          { debut: "13:45", fin: "18:38" },
        ],
      },
      {
        libelle: "Période saisonnière",
        plages: [
          { debut: "08:25", fin: "12:32" },
          { debut: "13:45", fin: "18:38" },
        ],
      },
    ],
  },
  {
    code: "263",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période principale",
        plages: [
          { debut: "08:08", fin: "12:51" },
          { debut: "13:46", fin: "18:35" },
        ],
      },
      {
        libelle: "Période saisonnière",
        plages: [
          { debut: "08:08", fin: "12:51" },
          { debut: "13:46", fin: "18:35" },
        ],
      },
    ],
  },

  /* ===== SERVICE SAISONNIER UNIQUEMENT ===== */

  {
    code: "303",
    type: "STANDARD",
    periodes: [
      {
        libelle: "Période saisonnière",
        plages: [
          { debut: "09:31", fin: "12:56" },
          { debut: "13:46", fin: "18:38" },
        ],
      },
    ],
  },
];

