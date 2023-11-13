/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ChatStreamRequest } from '../models/ChatStreamRequest';
import type { ChatThread } from '../models/ChatThread';
import type { NewThreadRequest } from '../models/NewThreadRequest';
import type { Profile } from '../models/Profile';
import type { SavedChatMessage } from '../models/SavedChatMessage';

import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';

export class DefaultService {

    constructor(public readonly httpRequest: BaseHttpRequest) {}

    /**
     * Profiles
     * List all user profiles
     * @returns Profile Successful Response
     * @throws ApiError
     */
    public profilesProfilesGet(): CancelablePromise<Array<Profile>> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/profiles',
        });
    }

    /**
     * Profile Threads
     * List all threads for a given user profile
     * @param profileId
     * @returns ChatThread Successful Response
     * @throws ApiError
     */
    public profileThreadsProfileProfileIdThreadsGet(
        profileId: number,
    ): CancelablePromise<Array<ChatThread>> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/profile/{profile_id}/threads',
            path: {
                'profile_id': profileId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }

    /**
     * New Threads
     * List all threads for a given user profile
     * @param profileId
     * @returns ChatThread Successful Response
     * @throws ApiError
     */
    public newThreadsProfileProfileIdThreadsNewPost(
        profileId: number,
    ): CancelablePromise<Array<ChatThread>> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/profile/{profile_id}/threads/new',
            path: {
                'profile_id': profileId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }

    /**
     * Thread History
     * List all threads for a given user profile
     * @param threadId
     * @returns SavedChatMessage Successful Response
     * @throws ApiError
     */
    public threadHistoryThreadThreadIdHistoryGet(
        threadId: number,
    ): CancelablePromise<Array<SavedChatMessage>> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/thread/{thread_id}/history',
            path: {
                'thread_id': threadId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }

    /**
     * New Thread
     * List all threads for a given user profile
     * @param requestBody
     * @returns number Successful Response
     * @throws ApiError
     */
    public newThreadThreadsNewPost(
        requestBody: NewThreadRequest,
    ): CancelablePromise<number> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/threads/new',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }

    /**
     * Chat Stream
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public chatStreamChatStreamPost(
        requestBody: ChatStreamRequest,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/chat/stream',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }

}
