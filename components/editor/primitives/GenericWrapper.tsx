"use client";

import React from "react";
import type { BlockComponentProps } from "@/types/editor";

export interface GenericWrapperProps {
  originalType?: string;
  originalProps?: Record<string, unknown>;
  content?: string;
  style?: Record<string, unknown>;
  className?: string;
}

const SAFE_TAGS = new Set([
  "div", "span", "p", "h1", "h2", "h3", "h4", "h5", "h6",
  "section", "article", "header", "footer", "main", "aside",
  "ul", "ol", "li", "blockquote", "code", "pre",
]);

export function GenericWrapper({
  originalType = "div",
  content,
  style,
  className,
  children,
}: BlockComponentProps<GenericWrapperProps> & {
  children?: React.ReactNode;
}) {

  const tagName = SAFE_TAGS.has(originalType) ? originalType : "div";

  return React.createElement(
    tagName,
    {
      className,
      style: style as React.CSSProperties,
      "data-original-type": originalType,
    },
    React.createElement(
      React.Fragment,
      null,
      content ? React.createElement("div", {
        dangerouslySetInnerHTML: { __html: content },
      }) : null,
      children
    )
  );
}

GenericWrapper.displayName = "GenericWrapper";

GenericWrapper.defaults = {
  originalType: "div",
  content: "",
} satisfies GenericWrapperProps;
