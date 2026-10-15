import type { ExempleMouvement } from "@/lib/exemples";

// Barres asymétriques : un mouvement par niveau, à la note de départ maximale du niveau.
export const EXEMPLES_BARRES: ExempleMouvement[] = [
  {
    "apparatus": "BARRES_ASYM",
    "evolutionId": "A1",
    "titre": "Barres asymétriques A1 — mouvement à la note maximale",
    "elements": [
      {
        "code": "4rot"
      },
      {
        "code": "2new-va"
      },
      {
        "code": "62elan"
      },
      {
        "code": "64elan"
      },
      {
        "code": "91rot"
      },
      {
        "code": "145-26"
      },
      {
        "code": "7new-bb"
      },
      {
        "code": "116-26"
      }
    ],
    "confirmations": [
      "BA-A1-V1",
      "BA-A1-V2",
      "BA-A1-V3",
      "BA-A1-V4"
    ],
    "validations": {
      "BA-A1-TC-1": [
        "4rot",
        "2new-va"
      ],
      "BA-A1-TC-2": [
        "7new-bb",
        "116-26"
      ],
      "BA-A1-V1": [
        "116-26"
      ],
      "BA-A1-V2": [
        "4rot",
        "2new-va"
      ],
      "BA-A1-V3": [
        "62elan",
        "64elan",
        "145-26"
      ],
      "BA-A1-V4": [
        "2new-va"
      ]
    },
    "remarques": [
      "Entrée : établissement à l'appui facial depuis la station faciale (BI), puis balancé de bascule (venir à l'appui). Sortie : par repoussé depuis l'appui facial BI, après les balancés.",
      "À vérifier : les trois éléments de l'arche des élans de ce mouvement sont des nomades (62elan, 64elan) et un prérequis (145-26). Les nomades et les prérequis ne sont jamais valorisables : en toute rigueur, « 1 élément de l'arche des élans » (+2) ne serait pas validée (note de 11 au lieu de 13). Elle compte en revanche pour le tronc commun.",
      "« 1 mouvement en 2 parties avec interruption (BI ou BS ou inversement) » : à confirmer à la main."
    ]
  }
];
