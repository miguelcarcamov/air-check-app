/**
 * Clone a `<template>` by id and return its document fragment.
 * @param {string} id
 * @returns {DocumentFragment}
 */
export function cloneTemplate(id) {
  const tpl = document.getElementById(id);
  if (!tpl || !(tpl instanceof HTMLTemplateElement)) {
    throw new Error(`Template #${id} not found`);
  }
  return tpl.content.cloneNode(true);
}

/**
 * @param {string} id
 * @param {string} message
 */
export function fillSettingsMessage(id, message) {
  const fragment = cloneTemplate(id);
  const el = fragment.querySelector(".settings-current");
  if (el) el.textContent = message;
  return fragment;
}
