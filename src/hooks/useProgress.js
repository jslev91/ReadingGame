// Stub — progression logic to be built in a later session.
import { getGraphemeStatus, setGraphemeStatus } from '../services/storage'

export function useProgress(userId) {
  function getStatus(grapheme) {
    return getGraphemeStatus(userId, grapheme)
  }

  function setStatus(grapheme, status) {
    setGraphemeStatus(userId, grapheme, status)
  }

  return { getStatus, setStatus }
}
