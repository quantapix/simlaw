import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { ISettingRegistry } from '@jupyterlab/settingregistry';

import { requestAPI } from './handler';

/**
 * Initialization data for the simlaw extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'simlaw:plugin',
  autoStart: true,
  optional: [ISettingRegistry],
  activate: (app: JupyterFrontEnd, settingRegistry: ISettingRegistry | null) => {
    console.log('JupyterLab extension simlaw is activated!');

    if (settingRegistry) {
      settingRegistry
        .load(plugin.id)
        .then(settings => {
          console.log('simlaw settings loaded:', settings.composite);
        })
        .catch(reason => {
          console.error('Failed to load settings for simlaw.', reason);
        });
    }

    requestAPI<any>('get_example')
      .then(data => {
        console.log(data);
      })
      .catch(reason => {
        console.error(
          `The simlaw server extension appears to be missing.\n${reason}`
        );
      });
  }
};

export default plugin;
