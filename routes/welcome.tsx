// Copyright 2023-2025 the Deno authors. All rights reserved. MIT license.
import { defineRoute } from "$fresh/src/server/defines.ts";
import Head from "@/components/Head.tsx";
import { isGitHubSetup } from "@/utils/github.ts";

function SetupInstruction() {
  return (
    <div class="bg-green-50 dark:bg-gray-900 dark:border dark:border-green-800 rounded-xl max-w-screen-sm mx-auto p-8 space-y-2">
      <h1 class="text-2xl font-medium">Oi Alzi!</h1>

      <p class="text-gray-600 dark:text-gray-400">
        Tudo bom com voce?
      </p>

      <p>
        <a
          href="https://github.com/denoland/saaskit#get-started-locally"
          class="inline-flex gap-2 text-green-600 dark:text-green-400 hover:underline cursor-pointer"
        >
          Get started locally guide &#8250;
        </a>
      </p>
      <p>
        <a
          href="https://github.com/denoland/saaskit#deploy-to-production"
          class="inline-flex gap-2 text-green-600 dark:text-green-400 hover:underline cursor-pointer"
        >
          Deploy to production guide &#8250;
        </a>
      </p>

      <p class="text-gray-600 dark:text-gray-400">
        After setting up{" "}
        <span class="bg-green-100 dark:bg-gray-800 p-1 rounded">
          GITHUB_CLIENT_ID
        </span>{" "}
        and{" "}
        <span class="bg-green-100 dark:bg-gray-800 p-1 rounded">
          GITHUB_CLIENT_SECRET
        </span>
        , this message will disappear.
      </p>
    </div>
  );
}

export default defineRoute((_req, ctx) => {
  return (
    <>
      <Head title="Welcome" href={ctx.url.href} />
      <main class="flex-1 flex justify-center items-center">
        {!isGitHubSetup() && <SetupInstruction />}
      </main>
    </>
  );
});
