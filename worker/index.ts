import { type FeedbackEnv, handleFeedback } from '../server/feedback';

/** Cloudflare Worker: /api/feedback — письмо автору, всё остальное — статические файлы сайта. */
interface Env extends FeedbackEnv {
  ASSETS: { fetch: (request: Request) => Promise<Response> };
}

export default {
  fetch(request: Request, env: Env): Promise<Response> {
    if (new URL(request.url).pathname === '/api/feedback') return handleFeedback(request, env);
    return env.ASSETS.fetch(request);
  },
};
