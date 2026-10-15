import type { ExempleMouvement } from "@/lib/exemples";

// Barres asymétriques : un mouvement par niveau, à la note de départ maximale du niveau.
export const EXEMPLES_BARRES: ExempleMouvement[] = [
  {
    "apparatus": "BARRES_ASYM",
    "evolutionId": "A1",
    "titre": "Barres asymétriques A1 — mouvement à la note maximale",
    "elements": [
      {
        "code": "2new-va"
      },
      {
        "code": "4rot"
      },
      {
        "code": "91rot"
      },
      {
        "code": "68-26"
      },
      {
        "code": "7new-bb"
      },
      {
        "code": "116-26"
      }
    ],
    "confirmations": [
      "BA-A1-TC-1",
      "BA-A1-V1",
      "BA-A1-V2",
      "BA-A1-V3",
      "BA-A1-V4"
    ],
    "validations": {
      "BA-A1-TC-1": [
        "2new-va",
        "4rot"
      ],
      "BA-A1-TC-2": [
        "7new-bb",
        "116-26"
      ],
      "BA-A1-V1": [
        "116-26"
      ],
      "BA-A1-V2": [
        "2new-va",
        "4rot"
      ],
      "BA-A1-V3": [
        "68-26"
      ],
      "BA-A1-V4": [
        "2new-va"
      ]
    },
    "remarques": [
      "Balancé de bascule (venir à l'appui, P2), établissement à l'appui facial, tour d'appui facial en arrière, pose des pieds jambes groupées (élans, P2), puis les balancés (avant avec placement par l'entraîneur, puis arrière).",
      "« 1 élément de l'arche des élans » est validée par la pose des pieds jambes groupées (P2, valorisable). « 1 élément des arches Balancés » par le balancé arrière (P2). « 1 élément de l'arche venir à l'appui » par le balancé de bascule (P2).",
      "« 1 élément BI et 1 BS » et « 1 mouvement en 2 parties avec interruption (BI ou BS ou inversement) » sont confirmées à la main."
    ]
  },
  {
    "apparatus": "BARRES_ASYM",
    "evolutionId": "A2",
    "titre": "Barres asymétriques A2 — mouvement à la note maximale",
    "elements": [
      {
        "code": "2new-va"
      },
      {
        "code": "1bisnew"
      },
      {
        "code": "70elan"
      },
      {
        "code": "91rot"
      },
      {
        "code": "68-26"
      },
      {
        "code": "117bb"
      },
      {
        "code": "116-26"
      },
      {
        "code": "117bb"
      },
      {
        "code": "116-26"
      }
    ],
    "confirmations": [
      "BA-A2-TC-1",
      "BA-A2-V1",
      "BA-A2-V2",
      "BA-A2-V3",
      "BA-A2-V4"
    ],
    "validations": {
      "BA-A2-TC-1": [
        "2new-va",
        "1bisnew"
      ],
      "BA-A2-TC-2": [
        "117bb",
        "116-26"
      ],
      "BA-A2-V1": [
        "117bb",
        "116-26"
      ],
      "BA-A2-V2": [
        "1bisnew"
      ],
      "BA-A2-V3": [
        "70elan"
      ],
      "BA-A2-V4": [
        "68-26"
      ]
    },
    "remarques": [
      "Enchaînement de balancés : balancé avant à l'horizontale puis balancé arrière, répétés deux fois (les balancés répétés ne comptent qu'une fois dans le nombre d'éléments).",
      "« 1 élément de l'arche des élans » est validée par la prise d'élan corps aligné (70) et « 1 pose de pieds à la station debout puis sortie en saut droit vers l'avant » par la pose des pieds jambes groupées (68-26) : chaque valorisation a son propre élément (FAQ #214)."
    ]
  },
  {
    "apparatus": "BARRES_ASYM",
    "evolutionId": "B1",
    "titre": "Barres asymétriques B1 — mouvement à la note maximale",
    "elements": [
      {
        "code": "2new-va"
      },
      {
        "code": "1bisnew"
      },
      {
        "code": "70elan"
      },
      {
        "code": "91rot"
      },
      {
        "code": "68-26"
      },
      {
        "code": "117bb"
      },
      {
        "code": "116-26"
      },
      {
        "code": "117bb"
      },
      {
        "code": "116-26"
      },
      {
        "code": "154-26"
      }
    ],
    "confirmations": [
      "BA-B1-V1",
      "BA-B1-V2",
      "BA-B1-V3",
      "BA-B1-V4"
    ],
    "validations": {
      "BA-B1-TC-1": [
        "117bb",
        "116-26"
      ],
      "BA-B1-TC-2": [
        "2new-va",
        "1bisnew"
      ],
      "BA-B1-V1": [
        "117bb",
        "116-26"
      ],
      "BA-B1-V2": [
        "68-26"
      ],
      "BA-B1-V3": [
        "70elan",
        "91rot"
      ]
    },
    "remarques": [
      "Enchaînement de balancés : balancé avant à l'horizontale puis balancé arrière, répétés deux fois (les balancés répétés ne comptent qu'une fois dans le nombre d'éléments). La sortie (élan vers l'avant et salto arrière) vient en dernier.",
      "« 1 sortie amenée du balancé arrière » n'est pas confirmée : la sortie est un salto arrière depuis un élan avant, pas une sortie amenée d'un balancé arrière. Les quatre autres valorisations suffisent pour la note maximale (4 retenues sur 5).",
      "« 1 changement de barre BI-BS » est confirmée à la main."
    ]
  },
  {
    "apparatus": "BARRES_ASYM",
    "evolutionId": "B2",
    "titre": "Barres asymétriques B2 — mouvement à la note maximale",
    "elements": [
      {
        "code": "15-26"
      },
      {
        "code": "70elan"
      },
      {
        "code": "91rot"
      },
      {
        "code": "98-26"
      },
      {
        "code": "117bb"
      },
      {
        "code": "116-26"
      },
      {
        "code": "117bb"
      },
      {
        "code": "116-26"
      },
      {
        "code": "154-26"
      }
    ],
    "confirmations": [
      "BA-B2-TC-1",
      "BA-B2-V1",
      "BA-B2-V2",
      "BA-B2-V3",
      "BA-B2-V4"
    ],
    "validations": {
      "BA-B2-TC-2": [
        "70elan"
      ],
      "BA-B2-TC-3": [
        "15-26"
      ],
      "BA-B2-V1": [
        "117bb",
        "116-26"
      ],
      "BA-B2-V2": [
        "154-26"
      ],
      "BA-B2-V3": [
        "98-26"
      ],
      "BA-B2-V4": [
        "15-26",
        "70elan"
      ]
    },
    "remarques": [
      "Enchaînement de balancés : balancé avant à l'horizontale puis balancé arrière, répétés deux fois (les balancés répétés ne comptent qu'une fois dans le nombre d'éléments). La sortie (élan vers l'avant et salto arrière) vient en dernier.",
      "« 1 rotation P3 minimum » est validée par la pose des pieds puis élan circulaire (98-26, P3), « 1 élément P3 minimum » par la sortie (P3), « bascule prise d'élan à l'horizontale » par la bascule (P4) précédée de la prise d'élan : chaque valorisation a ses propres éléments (FAQ #214).",
      "« 1 sortie P3 minimum » n'est pas confirmée : la sortie sert déjà à « 1 élément P3 minimum ». Les quatre autres valorisations suffisent pour la note maximale (4 retenues sur 5)."
    ]
  },
  {
    "apparatus": "BARRES_ASYM",
    "evolutionId": "B3",
    "titre": "Barres asymétriques B3 — mouvement à la note maximale",
    "elements": [
      {
        "code": "15-26"
      },
      {
        "code": "98-26"
      },
      {
        "code": "46-26"
      },
      {
        "code": "70elan"
      },
      {
        "code": "121rot"
      },
      {
        "code": "52-26"
      },
      {
        "code": "91rot"
      },
      {
        "code": "154-26"
      }
    ],
    "confirmations": [
      "BA-B3-TC-1",
      "BA-B3-V1",
      "BA-B3-V2",
      "BA-B3-V3",
      "BA-B3-V4"
    ],
    "validations": {
      "BA-B3-TC-2": [
        "52-26"
      ],
      "BA-B3-TC-3": [
        "15-26",
        "46-26"
      ],
      "BA-B3-V1": [
        "52-26"
      ],
      "BA-B3-V2": [
        "154-26",
        "15-26"
      ],
      "BA-B3-V3": [
        "98-26"
      ],
      "BA-B3-V4": [
        "46-26",
        "70elan"
      ]
    },
    "remarques": [
      "Venir à l'appui (bascule, bascule BS), rotation, prise d'élan, grand rétablissement, tour d'appui, puis la sortie en dernier.",
      "« 1 élément en balancé avant ou arrière (hors sortie) » est validée par le grand rétablissement (P3, arche Balancés), valorisable en B3. « 1 rotation P3 minimum » par la pose des pieds puis élan circulaire (P3), « 2 éléments P3 minimum » par la sortie et la bascule, « bascule prise d'élan » par la bascule BS précédée de la prise d'élan : chaque valorisation a ses propres éléments (FAQ #214).",
      "« 1 sortie P4 minimum » n'est pas confirmée : la sortie est en P3. Les quatre autres valorisations suffisent pour la note maximale (4 retenues sur 5)."
    ]
  },
  {
    "apparatus": "BARRES_ASYM",
    "evolutionId": "C1",
    "titre": "Barres asymétriques C1 — mouvement à la note maximale",
    "elements": [
      {
        "code": "15-26"
      },
      {
        "code": "100rot"
      },
      {
        "code": "51-26"
      },
      {
        "code": "73-26"
      },
      {
        "code": "98-26"
      },
      {
        "code": "46-26"
      },
      {
        "code": "121rot"
      },
      {
        "code": "52-26"
      },
      {
        "code": "91rot"
      },
      {
        "code": "154-26"
      }
    ],
    "confirmations": [
      "BA-C1-TC-1",
      "BA-C1-V2",
      "BA-C1-V3",
      "BA-C1-V4",
      "BA-C1-V5"
    ],
    "validations": {
      "BA-C1-TC-2": [
        "73-26"
      ],
      "BA-C1-TC-3": [
        "52-26"
      ],
      "BA-C1-V2": [
        "52-26"
      ],
      "BA-C1-V3": [
        "15-26"
      ],
      "BA-C1-V4": [
        "100rot"
      ],
      "BA-C1-V5": [
        "73-26"
      ]
    },
    "remarques": [
      "Venir à l'appui (bascule, bascule faciale, bascule BS), rotations, élan à l'ATR, grand rétablissement, puis la sortie en dernier.",
      "« 1 élément en balancé avant ou arrière » est validée par le grand rétablissement (P3), « 1 élément fini à l'ATR » par l'élan en arrière à l'ATR (P5), « 1 rotation P4 minimum » par le tour d'appui arrière libre (P4), « 1 élément P4 minimum » par la bascule (P4) : chaque valorisation a ses propres éléments (FAQ #214).",
      "« 1 lâcher » et « 1 sortie P4 minimum amenée du balancé » ne sont pas confirmées : le mouvement ne contient pas de lâcher et la sortie est en P3. Les quatre autres valorisations suffisent pour la note maximale (4 retenues sur 6)."
    ]
  },
  {
    "apparatus": "BARRES_ASYM",
    "evolutionId": "C2",
    "titre": "Barres asymétriques C2 — mouvement à la note maximale",
    "elements": [
      {
        "code": "15-26"
      },
      {
        "code": "100rot"
      },
      {
        "code": "51-26"
      },
      {
        "code": "98-26"
      },
      {
        "code": "46-26"
      },
      {
        "code": "73-26"
      },
      {
        "code": "124bb"
      },
      {
        "code": "157-26"
      }
    ],
    "confirmations": [
      "BA-C2-TC-1",
      "BA-C2-V2",
      "BA-C2-V3",
      "BA-C2-V4",
      "BA-C2-V5"
    ],
    "validations": {
      "BA-C2-TC-2": [
        "124bb"
      ],
      "BA-C2-TC-3": [
        "73-26"
      ],
      "BA-C2-V2": [
        "124bb"
      ],
      "BA-C2-V3": [
        "51-26"
      ],
      "BA-C2-V4": [
        "100rot"
      ],
      "BA-C2-V5": [
        "15-26",
        "73-26"
      ]
    },
    "remarques": [
      "Venir à l'appui (bascule, bascule faciale, bascule BS), rotations, élan à l'ATR, grand tour, puis la sortie en dernier.",
      "« 1 grand tour » est validée par le grand tour en arrière 360° (soleil, P5), « 1 élément P5 minimum » par la bascule faciale (P5), « 1 rotation P4 minimum » par le tour d'appui arrière libre (P4), « bascule avec un élément fini à l'ATR » par la bascule suivie de l'élan en arrière à l'ATR (P5) : chaque valorisation a ses propres éléments (FAQ #214).",
      "« 1 lâcher » et « 1 sortie P5 minimum » ne sont pas confirmées : le mouvement ne contient pas de lâcher et la sortie (salto arrière tendu) est en P4. Les quatre autres valorisations suffisent pour la note maximale (4 retenues sur 6)."
    ]
  },
  {
    "apparatus": "BARRES_ASYM",
    "evolutionId": "C3",
    "titre": "Barres asymétriques C3 — mouvement à la note maximale",
    "elements": [
      {
        "code": "15-26"
      },
      {
        "code": "76elan"
      },
      {
        "code": "103rot"
      },
      {
        "code": "51-26"
      },
      {
        "code": "4new-rot"
      },
      {
        "code": "46-26"
      },
      {
        "code": "73-26"
      },
      {
        "code": "130-26"
      },
      {
        "code": "166-26"
      }
    ],
    "confirmations": [
      "BA-C3-TC-1",
      "BA-C3-V1",
      "BA-C3-V2",
      "BA-C3-V5",
      "BA-C3-V6"
    ],
    "validations": {
      "BA-C3-TC-2": [
        "130-26"
      ],
      "BA-C3-TC-3": [
        "76elan",
        "73-26"
      ],
      "BA-C3-V1": [
        "4new-rot"
      ],
      "BA-C3-V2": [
        "130-26"
      ],
      "BA-C3-V6": [
        "130-26",
        "166-26"
      ]
    },
    "remarques": [
      "Venir à l'appui (bascules), élans à l'ATR, rotations, grand tour arrière, puis la sortie (double salto arrière) en dernier.",
      "« 1 lâcher P5 minimum » est validée par l'élément avec envol arrivée à la suspension (4new-rot, P5). « 1 ATR ou grand tour avec rotation 180° » est confirmée à la main.",
      "À vérifier : le grand tour arrière (P7) sert à la fois à « 1 élément en balancé P5 minimum » et d'élément d'amenée à « 1 sortie P5 minimum amenée d'un élément P5 minimum ». Un élément ne valide qu'une seule valorisation (FAQ #214, #45) : en toute rigueur, l'une des deux (+2) ne serait pas retenue (note de 13 au lieu de 15), sauf avec un deuxième élément P5 ou plus avant la sortie ou un autre balancé P5 minimum.",
      "« 1 élément P5 minimum » et « 1 rotation P6 minimum » ne sont pas confirmées."
    ]
  }
];
