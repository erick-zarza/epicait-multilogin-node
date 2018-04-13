/* eslint-disable import/prefer-default-export */

/**
 * POST     /auth/login         ->  login
 */
import local from '../../auth/local';
import googleAuth from '../../auth/google';

export function login(req, res, next) {
  local(req, res, next);
}
export function google(req, res, next) {
  googleAuth(req, res, next);
}
