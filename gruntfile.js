/* global module, require  */
module.exports = function (grunt) {
  'use strict';

  const SRC_DIR = 'src/',
    SRC_FILES = [
      SRC_DIR + 'index.js'
    ],
    BUILD_DIR = 'build/',
    DOC_DIR = 'doc',
    BUILD_TARGET = 'TextHighlighter.min.js';

  grunt.initConfig({
    _TARGET: BUILD_DIR + BUILD_TARGET,

    jsdoc : {
      dist : {
        src: SRC_FILES.concat('README.md'),
        options: {
          configure: 'jsdoc.conf.json',
          destination: DOC_DIR,
          private: false,
          // template : 'node_modules/grunt-jsdoc/node_modules/ink-docstrap/template'
        }
      }
    },

    clean: [ BUILD_DIR, DOC_DIR ]
  });
    
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-jsdoc');

};
