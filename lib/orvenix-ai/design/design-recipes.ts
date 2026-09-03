import type {
  OrvenixDesignIntent,
  OrvenixDesignRecipe,
} from "./types"

const RECIPES: Record<
  Exclude<
    OrvenixDesignIntent,
    "unknown"
  >,
  OrvenixDesignRecipe
> = {
  premium: {
    intent: "premium",

    theme: [
      {
        path: "spacing.sectionY",
        value: "5rem",
      },
      {
        path: "spacing.sectionX",
        value: "2rem",
      },
      {
        path: "spacing.stack",
        value: "1.5rem",
      },
      {
        path: "radius.card",
        value: "1rem",
      },
      {
        path: "radius.button",
        value: "999px",
      },
    ],

    multi: [
      {
        target: "sections",
        operation: "set_padding_y",
        value: "xl",
      },
      {
        target: "sections",
        operation: "set_max_width",
        value: "lg",
      },
      {
        target: "sections",
        operation: "set_border_radius",
        value: "lg",
      },
      {
        target: "sections",
        operation: "set_shadow",
        value: "md",
      },
      {
        target: "buttons",
        operation: "set_variant",
        value: "primary",
      },
      {
        target: "buttons",
        operation: "set_button_size",
        value: "lg",
      },
    ],
  },

  minimal: {
    intent: "minimal",

    theme: [
      {
        path: "spacing.sectionY",
        value: "3rem",
      },
      {
        path: "spacing.sectionX",
        value: "1.5rem",
      },
      {
        path: "spacing.stack",
        value: "1rem",
      },
      {
        path: "radius.card",
        value: "0.5rem",
      },
      {
        path: "radius.button",
        value: "0.5rem",
      },
    ],

    multi: [
      {
        target: "sections",
        operation: "set_padding_y",
        value: "md",
      },
      {
        target: "sections",
        operation: "set_shadow",
        value: "none",
      },
      {
        target: "sections",
        operation: "set_border_radius",
        value: "sm",
      },
      {
        target: "buttons",
        operation: "set_variant",
        value: "ghost",
      },
    ],
  },

  modern: {
    intent: "modern",

    theme: [
      {
        path: "spacing.sectionY",
        value: "4rem",
      },
      {
        path: "spacing.sectionX",
        value: "2rem",
      },
      {
        path: "spacing.stack",
        value: "1.5rem",
      },
      {
        path: "radius.card",
        value: "1rem",
      },
      {
        path: "radius.button",
        value: "0.75rem",
      },
    ],

    multi: [
      {
        target: "sections",
        operation: "set_padding_y",
        value: "lg",
      },
      {
        target: "sections",
        operation: "set_max_width",
        value: "xl",
      },
      {
        target: "sections",
        operation: "set_border_radius",
        value: "lg",
      },
      {
        target: "sections",
        operation: "set_shadow",
        value: "sm",
      },
      {
        target: "buttons",
        operation: "set_button_size",
        value: "lg",
      },
    ],
  },

  elegant: {
    intent: "elegant",

    theme: [
      {
        path: "spacing.sectionY",
        value: "5rem",
      },
      {
        path: "spacing.sectionX",
        value: "2rem",
      },
      {
        path: "spacing.stack",
        value: "1.5rem",
      },
      {
        path: "radius.card",
        value: "0.75rem",
      },
      {
        path: "radius.button",
        value: "999px",
      },
    ],

    multi: [
      {
        target: "sections",
        operation: "set_padding_y",
        value: "xl",
      },
      {
        target: "sections",
        operation: "set_max_width",
        value: "lg",
      },
      {
        target: "sections",
        operation: "set_shadow",
        value: "sm",
      },
      {
        target: "buttons",
        operation: "set_variant",
        value: "secondary",
      },
    ],
  },

  compact: {
    intent: "compact",

    theme: [
      {
        path: "spacing.sectionY",
        value: "1.5rem",
      },
      {
        path: "spacing.sectionX",
        value: "1.5rem",
      },
      {
        path: "spacing.stack",
        value: "0.75rem",
      },
    ],

    multi: [
      {
        target: "sections",
        operation: "set_padding_y",
        value: "sm",
      },
      {
        target: "sections",
        operation: "set_margin_y",
        value: "sm",
      },
      {
        target: "buttons",
        operation: "set_button_size",
        value: "sm",
      },
    ],
  },

  spacious: {
    intent: "spacious",

    theme: [
      {
        path: "spacing.sectionY",
        value: "5rem",
      },
      {
        path: "spacing.sectionX",
        value: "2rem",
      },
      {
        path: "spacing.stack",
        value: "2rem",
      },
    ],

    multi: [
      {
        target: "sections",
        operation: "set_padding_y",
        value: "xl",
      },
      {
        target: "sections",
        operation: "set_padding_x",
        value: "lg",
      },
      {
        target: "sections",
        operation: "set_margin_y",
        value: "lg",
      },
      {
        target: "sections",
        operation: "set_max_width",
        value: "xl",
      },
    ],
  },
}

export function getDesignRecipe(
  intent: OrvenixDesignIntent,
): OrvenixDesignRecipe | null {
  if (intent === "unknown") {
    return null
  }

  return RECIPES[intent]
}

export function getDesignRecipes() {
  return RECIPES
}
