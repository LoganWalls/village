/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { ChatRole } from './ChatRole';

export type ChatMessage = {
    id?: (number | null);
    timestamp?: (string | null);
    thread_id?: (number | null);
    role: ChatRole;
    content: string;
};

