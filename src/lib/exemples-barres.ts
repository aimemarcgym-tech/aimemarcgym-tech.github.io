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
      "« 1 élément BI et 1 BS » et « 1 mouvement en 2 parties avec interruption (BI ou BS ou inversement) » sont confirmées à la main : à vérifier selon la chorégraphie."
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
  }
];
