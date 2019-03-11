/* global chrome */

chrome.devtools.panels.create(
    'dataslayer' + (chrome.runtime.id === 'ikbablmmjldhamhcldjjigniffkkjgpo' ? '' : ' beta'),
    'i128.png',
    'index.html',
    null // no callback needed
);
