;;; Option.m
;;;
;;; An implementation of nullable values encoded using a pair of a boolean and
;;; an optional value.
;;;
;;; All definitions in this file are optimized to use the backend's native
;;; implementation of null.

;; A container for a value.
(def some right)

;; The singleton null value.
(def null (left false))

;; Tests if an option has a value.
(def some? right?)

;; Tests if an option is null.
(def null? left?)

;; The value of an option, or false if it is null.
(defn unnull either
  (either id id))