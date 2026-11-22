import { type FeedbackEnv, handleFeedback } from '../../server/feedback';

/** Cloudflare Pages Functions: тот же обработчик для проекта, созданного как Pages. */
export const onRequest = ({ request, env }: { request: Request; env: FeedbackEnv }) => handleFeedback(request, env);
