// Copyright 2023-2025 the Deno authors. All rights reserved. MIT license.
import type { Handlers } from "$fresh/server.ts";
import {collectValues, listProductsVotedByUser} from "@/utils/db.ts";
import { SignedInState } from "@/plugins/session.ts";

export const handler: Handlers<undefined, SignedInState> = {
  async GET(_req, ctx) {
    const iter = listProductsVotedByUser(ctx.state.sessionUser.login);
    const items = await collectValues(iter);
    return Response.json(items);
  },
};
