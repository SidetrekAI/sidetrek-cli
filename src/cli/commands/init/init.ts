import * as p from '@clack/prompts'
import * as R from 'ramda'
import { setTimeout as sleep } from 'node:timers/promises'
import chalk from 'chalk'
import { colors } from '../../constants'
import { validateProjectName } from '../../validators'
import { clackLog, endStopwatch, startStopwatch } from '../../utils'
import { buildDagsterIcebergTrinoStack } from './stacks/dagsterIcebergTrinoStack'

// NOTE: cwd is the PARENT of the root project dir (because it's not created yet before `init`)
export default async function init(options: any) {
  /**
   *
   * PREREQUISITES
   *
   *    - Python 3.10-3.11
   *    - Poetry
   *    - git (for Superset)
   *
   */

  console.log('\n')
  const s = p.spinner()

  await p.group(
    {
      intro: () => p.intro(colors.sidetrekPurple(`🔥 Let's create a new data project!`)),
      prerequisites: async ({ results }) => {
        return await p.confirm({
          message: `Sidetrek requires ${chalk.underline.yellow('Python 3.10-3.11')}, ${chalk.underline.yellow(
            'Poetry'
          )}, and git CLI installed. Are you ready to continue?`,
        })
      },
      pythonVersion: async ({ results }) => {
        if (!results.prerequisites) {
          p.cancel(
            'No worries - please try again after installing the prerequisites.\n   (e.g. `pyenv install 3.10 && pyenv global 3.10 && pip install poetry`)'
          )
          process.exit(0)
        }

        return await p.select({
          message: `Which python version would you like to use?`,
          options: [
            { value: '3.10', label: '3.10' },
            { value: '3.11', label: '3.11' },
          ],
        })
      },
      projectName: async ({ results }) => {
        return await p.text({
          message: 'Awesome! What would you like to name your project?',
          placeholder: 'my_shiny_new_project',
          validate: validateProjectName,
        })
      },
      stack: async ({ results }) => {
        return await p.select({
          message: `Which data stack would you like to build?`,
          options: [
            {
              value: 'dagsterIcebergTrinoStack',
              label: 'Dagster, Meltano, DBT, Iceberg, Trino, and Superset',
              hint: 'Sorry, this is the only option at the moment',
            },
          ],
        })
      },
      example: async ({ results }) => {
        return await p.select({
          message: `Would you like to include example code?`,
          options: [
            { value: true, label: 'Yes', hint: 'recommended' },
            { value: false, label: 'No' },
          ],
        })
      },
      buildStack: async ({ results }) => {
        const dataStack = results.stack as string

        if (R.equals(dataStack, 'dagsterIcebergTrinoStack')) {
          // Build the data stack
          await buildDagsterIcebergTrinoStack(results)
        }
      },
      outro: async () => {
        const outroMessage =
          colors.sidetrekPurple(`You're all set - enjoy building your new data project! 🚀`) +
          colors.sidetrekLightPurple(
            '\n\n   (Next up - Check out the quickstart tutorial at https://docs.sidetrek.com/get-started/overview)'
          )
        return await p.outro(outroMessage)
      },
    },
    {
      // On Cancel callback that wraps the group
      // So if the user cancels one of the prompts in the group this function will be called
      onCancel: ({ results }) => {
        p.cancel('Operation cancelled.')
        process.exit(0)
      },
    }
  )
}