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
      "À confirmer : on ne sait pas si un saut Base peut recevoir la valorisation (la FAQ ne parle que des nomades). Sans valorisation, la note est de 12."
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
      "À confirmer : on ne sait pas si un saut Base peut recevoir la valorisation (la FAQ ne parle que des nomades). Sans valorisation, la note est de 12."
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
  }
];
