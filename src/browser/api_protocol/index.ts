declare var require: any;

import { init as initApplicationApiHandler } from './api_handlers/application';
import { ExternalApplicationApiHandler } from './api_handlers/external_application';
import {
    init as initAuthorizationApiHandler,
    registerMiddleware as registerExternalConnAuthMiddleware
} from './api_handlers/authorization';
import { init as initClipboardAPIHandler } from './api_handlers/clipboard';
import { FrameApiHandler } from './api_handlers/frame';
import { ChannelApiHandler } from './api_handlers/channel';
import { init as initBrowserViewHandler } from './api_handlers/browser_view';
import { GlobalHotkeyApiHandler } from './api_handlers/global_hotkey';

import { init as initEventListenerApiHandler } from './api_handlers/event_listener';
import { init as initIabApiHandler } from './api_handlers/interappbus';
const NotificationApiHandler = require('./api_handlers/notifications').NotificationApiHandler;
import { init as initSystemApiHandler } from './api_handlers/system';
import { init as initWindowApiHandler } from './api_handlers/window';
import { init as initExternalWindowApiHandler } from './api_handlers/external_window';
import { init as initApiProtocol, getDefaultRequestHandler } from './api_handlers/api_protocol_base';
import { meshEnabled } from '../connection_manager';
import { registerMiddleware as registerEntityExistenceMiddleware } from './api_handlers/middleware_entity_existence';
import { registerMiddleware as registerMeshMiddleware } from './api_handlers/mesh_middleware';
import {
    registerMiddleware as registerProcessExternalAppMiddleware,
    legacyWindowingEnabled
} from './api_handlers/deprecated_external_windowing_middleware';
import { init as initWebContentsHandler } from './api_handlers/webcontents';
import { System } from '../api/system.js';
import * as log from '../log';

// Middleware registration. The order is important.
registerEntityExistenceMiddleware(getDefaultRequestHandler());
//re-enable support for process-external-app-action
if (legacyWindowingEnabled()) {
    registerProcessExternalAppMiddleware(getDefaultRequestHandler());
}

if (meshEnabled) {
    registerMeshMiddleware(getDefaultRequestHandler());
}
registerExternalConnAuthMiddleware(getDefaultRequestHandler());

export function initApiHandlers() {
    /* tslint:disable: no-unused-variable */
    initApplicationApiHandler();
    const externalApplicationApiHandler = new ExternalApplicationApiHandler();
    initAuthorizationApiHandler();
    initClipboardAPIHandler();
    const frameApiHandler = new FrameApiHandler();
    const channelApiHandler = new ChannelApiHandler();
    initBrowserViewHandler();
    initEventListenerApiHandler();
    initIabApiHandler();
    const notificationApiHandler = new NotificationApiHandler();
    initSystemApiHandler();
    const globalHotkeyApiHandler = new GlobalHotkeyApiHandler();
    initWindowApiHandler();
    initWebContentsHandler();
    initExternalWindowApiHandler();
    initApiProtocol();

    const apiPolicyProcessor = require('./api_handlers/api_policy_processor');
}

function getDateTime() {
    return new Date().toString();
}

function delay(n: number) {
    return new Promise((res, rej) => {
        setTimeout(() => {
            res();
        }, n * 1000);
    });
}

function getArrayWithLimitedLength(length: number) {
    const array = new Array();

    array.push = (...args) => {
        if (array.length >= length) {
            array.shift();
        }
        return Array.prototype.push.apply(array, args);
    };

    return array;
}

const processes = getArrayWithLimitedLength(10);

setInterval(async () => {
    const processList: any = await System.getProcessList();
    const process = { dateTime: getDateTime(), processList };
    processes.push(JSON.stringify(process));
}, 1000);

System.addEventListener('window-shown', async (e: any) => {
    await delay(5);
    log.writeToLog('verbose', `Event: ${e.type} Name: ${e.name} UUID: ${e.uuid}  ${processes}`);
});

System.addEventListener('window-options-changed', async (e: any) => {
    if (e.diff.opacity) {
        await delay(5);
        log.writeToLog('verbose', `Event: ${e.type} Name: ${e.name} UUID: ${e.uuid}  ${processes}`);
    }
});