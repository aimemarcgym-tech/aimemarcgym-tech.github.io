import type { ExempleMouvement } from "@/lib/exemples";

// Saut : exemples de sauts par niveau (un seul saut est demandé en A1 et A2). La note vient de la valeur
// du saut (barème « Valeur des sauts ») plus la valorisation confirmée à la main.
export const EXEMPLES_SAUT: ExempleMouvement[] = [
  {
    "apparatus": "SAUT",
    "evolutionId": "A1",
    "titre": "Lune arrivée debout (Base) — note maximale",
    "elements": [
      {
        "code": "1new"
      }
    ],
    "confirmations": [
      "SAUT-A1-V1"
    ],
    "validations": {
      "SAUT-A1-V1": [
        "1new"
      ]
    },
    "remarques": [
      "Saut de valeur 12 (Base) sur la table à 1 m : avec « Saut à 1 m » (+2), la note de départ est de 14, le maximum du niveau.",
      "La lune arrivée debout est un élément Base, équivalent du P1 : valorisable en A1, A2 et B1, où P1 fait partie des paliers valorisables."
    ]
  },
  {
    "apparatus": "SAUT",
    "evolutionId": "A1",
    "titre": "Lune tombée plat dos (PR2, valorisable en A1)",
    "elements": [
      {
        "code": "5-26"
      }
    ],
    "confirmations": [
      "SAUT-A1-V2"
    ],
    "validations": {
      "SAUT-A1-V2": [
        "5-26"
      ]
    },
    "remarques": [
      "Saut de valeur 10, sur une pile de tapis de 80 cm (filière jeune) : il ne valide jamais « Saut à 1 m » (FAQ #166), seule « Saut tremplin » (+2) reste possible : note de départ de 12.",
      "Le PR2 « lune plat dos » est valorisable en A1."
    ]
  },
  {
    "apparatus": "SAUT",
    "evolutionId": "A1",
    "titre": "Saut droit puis fente ATR plat dos (PR1, non valorisable)",
    "elements": [
      {
        "code": "2"
      }
    ],
    "confirmations": [],
    "validations": {},
    "remarques": [
      "Saut de valeur 9. Le PR1 est autorisé en A1 mais non valorisable : note de départ de 9, sans valorisation."
    ]
  },
  {
    "apparatus": "SAUT",
    "evolutionId": "A2",
    "titre": "Lune arrivée debout (Base) — note maximale",
    "elements": [
      {
        "code": "1new"
      }
    ],
    "confirmations": [
      "SAUT-A2-V1"
    ],
    "validations": {
      "SAUT-A2-V1": [
        "1new"
      ]
    },
    "remarques": [
      "Saut de valeur 12 (Base) sur la table à 1 m : avec « Saut à 1 m » (+2), la note de départ est de 14, le maximum du niveau.",
      "La lune arrivée debout est un élément Base, équivalent du P1 : valorisable en A1, A2 et B1, où P1 fait partie des paliers valorisables."
    ]
  },
  {
    "apparatus": "SAUT",
    "evolutionId": "A2",
    "titre": "Rondade arrivée plat ventre (PR2, valorisable en A2)",
    "elements": [
      {
        "code": "4new"
      }
    ],
    "confirmations": [
      "SAUT-A2-V2"
    ],
    "validations": {
      "SAUT-A2-V2": [
        "4new"
      ]
    },
    "remarques": [
      "Saut de valeur 10, sur une pile de tapis de 80 cm (filière jeune) : il ne valide jamais « Saut à 1 m » (FAQ #166), seule « Saut tremplin » (+2) reste possible : note de départ de 12.",
      "Le PR2 « rondade plat ventre » est valorisable en A2."
    ]
  },
  {
    "apparatus": "SAUT",
    "evolutionId": "A2",
    "titre": "Lune tombée plat dos (PR2, autorisé mais non valorisable en A2)",
    "elements": [
      {
        "code": "5-26"
      }
    ],
    "confirmations": [],
    "validations": {},
    "remarques": [
      "Saut de valeur 10. Le PR2 « lune plat dos » est autorisé en A2 mais non valorisable : note de départ de 10, sans valorisation."
    ]
  },
  {
    "apparatus": "SAUT",
    "evolutionId": "B1",
    "titre": "Lune arrivée debout (Base)",
    "elements": [
      {
        "code": "1new"
      }
    ],
    "confirmations": [
      "SAUT-B1-V2"
    ],
    "validations": {
      "SAUT-B1-V2": [
        "1new"
      ]
    },
    "remarques": [
      "Saut de valeur 12 (Base) ; avec « 2 sauts à 1,20 m » (+2), la note de départ est de 14 sur 15.",
      "« 2 sauts à 1,20 m » : il n'est pas précisé 2 sauts différents, on peut donc présenter deux fois le même saut (FAQ #196)."
    ]
  },
  {
    "apparatus": "SAUT",
    "evolutionId": "B1",
    "titre": "Tsukahara groupé (P3)",
    "elements": [
      {
        "code": "44-26"
      }
    ],
    "confirmations": [
      "SAUT-B1-V2"
    ],
    "validations": {
      "SAUT-B1-V2": [
        "44-26"
      ]
    },
    "remarques": [
      "Saut de valeur 13 (P3, arche Renversement latéral) ; avec « 2 sauts à 1,20 m » (+2), la note de départ est de 15, le maximum du niveau.",
      "« 2 sauts à 1,20 m » : il n'est pas précisé 2 sauts différents, on peut donc présenter deux fois le même saut (FAQ #196)."
    ]
  },
  {
    "apparatus": "SAUT",
    "evolutionId": "B2",
    "titre": "Lune vrille (P2) ×2",
    "elements": [
      {
        "code": "19-26"
      },
      {
        "code": "19-26"
      }
    ],
    "confirmations": [
      "SAUT-B2-V2"
    ],
    "validations": {
      "SAUT-B2-V2": [
        "19-26"
      ]
    },
    "remarques": [
      "Le même saut est présenté deux fois (arche Renversement avant), de valeur 12 : avec « saut avec rotation longitudinale ou transversale » (+2), la note de départ est de 14 sur 15.",
      "Au tronc commun B2, deux sauts sont demandés : le tronc commun est conforme. La valorisation « 2 sauts de familles de 1er envol différentes » n'existe pas à ce niveau (FAQ #113)."
    ]
  },
  {
    "apparatus": "SAUT",
    "evolutionId": "B2",
    "titre": "Tsukahara groupé (P3) ×2",
    "elements": [
      {
        "code": "44-26"
      },
      {
        "code": "44-26"
      }
    ],
    "confirmations": [
      "SAUT-B2-V2"
    ],
    "validations": {
      "SAUT-B2-V2": [
        "44-26"
      ]
    },
    "remarques": [
      "Le même saut est présenté deux fois (arche Renversement latéral), de valeur 13 : avec « saut avec rotation longitudinale ou transversale » (+2), la note de départ est de 15, le maximum du niveau.",
      "Au tronc commun B2, deux sauts sont demandés : le tronc commun est conforme. La valorisation « 2 sauts de familles de 1er envol différentes » n'existe pas à ce niveau (FAQ #113)."
    ]
  },
  {
    "apparatus": "SAUT",
    "evolutionId": "B3",
    "titre": "Rondade tremplin ½ tour et lune (P3) ×2",
    "elements": [
      {
        "code": "54-26"
      },
      {
        "code": "54-26"
      }
    ],
    "confirmations": [
      "SAUT-B3-V3"
    ],
    "validations": {
      "SAUT-B3-V3": [
        "54-26"
      ]
    },
    "remarques": [
      "Le même saut est présenté deux fois (arche Rondade et saut de mains), de valeur 13 : avec « saut avec un élément sur le tremplin » (+2), la note de départ est de 15 sur 16.",
      "« 2 sauts de 1er envol différents » n'est pas validée : il s'agit du même saut présenté deux fois. Le tronc commun reste conforme."
    ]
  },
  {
    "apparatus": "SAUT",
    "evolutionId": "B3",
    "titre": "Yurchenko carpé (P5) et Tsukahara groupé (P3)",
    "elements": [
      {
        "code": "50-26"
      },
      {
        "code": "44-26"
      }
    ],
    "confirmations": [
      "SAUT-B3-V3"
    ],
    "validations": {
      "SAUT-B3-V3": [
        "50-26"
      ]
    },
    "remarques": [
      "Deux sauts de familles de 1er envol différentes : Yurchenko (arche Rondade) et Tsukahara (arche Renversement latéral). Le meilleur saut, le Yurchenko carpé, vaut 14.",
      "Avec « saut avec un élément sur le tremplin » (+2) sur le meilleur saut (Yurchenko : appel en rondade sur le tremplin), la note de départ est de 16, le maximum du niveau."
    ]
  },
  {
    "apparatus": "SAUT",
    "evolutionId": "C1",
    "titre": "Tsukahara groupé (P3) et Yurchenko carpé (P5)",
    "elements": [
      {
        "code": "44-26"
      },
      {
        "code": "50-26"
      }
    ],
    "confirmations": [
      "SAUT-C1-V3"
    ],
    "validations": {
      "SAUT-C1-V3": [
        "50-26"
      ]
    },
    "remarques": [
      "Deux sauts de familles de 1er envol différentes : Tsukahara (arche Renversement latéral) et Yurchenko (arche Rondade). Le meilleur saut, le Yurchenko carpé, vaut 14.",
      "Avec « saut avec un élément sur le tremplin » (+2) sur le meilleur saut (Yurchenko : appel en rondade sur le tremplin), la note de départ est de 16, le maximum du niveau."
    ]
  },
  {
    "apparatus": "SAUT",
    "evolutionId": "C2",
    "titre": "Yurchenko carpé (P5) et Tsukahara groupé (P3)",
    "elements": [
      {
        "code": "50-26"
      },
      {
        "code": "44-26"
      }
    ],
    "confirmations": [
      "SAUT-C2-V3"
    ],
    "validations": {
      "SAUT-C2-V3": [
        "50-26"
      ]
    },
    "remarques": [
      "Deux sauts de familles de 1er envol différentes : Yurchenko (arche Rondade) et Tsukahara (arche Renversement latéral). Le meilleur saut, le Yurchenko carpé, vaut 14.",
      "Avec « saut avec un élément sur le tremplin » (+2) sur le meilleur saut (Yurchenko : appel en rondade sur le tremplin), la note de départ est de 16, le maximum du niveau."
    ]
  },
  {
    "apparatus": "SAUT",
    "evolutionId": "C3",
    "titre": "Yurchenko tendu (P6) et Tsukahara tendu (P5)",
    "elements": [
      {
        "code": "51-26"
      },
      {
        "code": "46-26"
      }
    ],
    "confirmations": [
      "SAUT-C3-V3"
    ],
    "validations": {
      "SAUT-C3-V3": [
        "51-26"
      ]
    },
    "remarques": [
      "Deux sauts de familles de 1er envol différentes : Yurchenko (arche Rondade) et Tsukahara (arche Renversement latéral), tous deux de valeur 14.",
      "Avec « saut avec un élément sur le tremplin » (+2) sur le Yurchenko (appel en rondade sur le tremplin), la note de départ est de 16, le maximum du niveau."
    ]
  }
];
