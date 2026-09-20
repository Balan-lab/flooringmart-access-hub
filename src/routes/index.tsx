import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FlooringMart Access & Subscription Manager" },
      { name: "description", content: "Secure access to FlooringMart employee access, workflows and subscriptions." },
      { property: "og:title", content: "FlooringMart Access & Subscription Manager" },
      { property: "og:description", content: "Secure access to FlooringMart employee access, workflows and subscriptions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
  component: () => null,
});
