/* 
  this file copy from 
  https://github.com/ianstormtaylor/slate-plugins/tree/master/support/rollup 
  and add some custom changes
*/

import factory from './factory';

import helloworldPkg from '../packages/helloworld/package.json';

const configurations = [...factory(helloworldPkg)];

export default configurations;
