#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { AwsTutorialStack } from '../lib/aws-tutorial-stack';

const app = new cdk.App();
new AwsTutorialStack(app, 'AwsTutorialStack');
