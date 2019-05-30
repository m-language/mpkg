;; Represents that two values are equal.
(def compare= (object (symbol compare=)))

;; Represents that the first value is less than the second value.
(def compare< (object (symbol compare<)))

;; Represents that the first value is greater than the second value.
(def compare> (object (symbol compare>)))

;; Tests if a value is compare=.
(def compare=? (is? (symbol compare=)))

;; Tests if a value is compare<.
(def compare<? (is? (symbol compare<)))

;; Tests if a value is compare>.
(def compare>? (is? (symbol compare>)))

;; Folds over the result of a compare.
(defn fold-compare compare < > =
  (cond
    (compare<? compare) (< compare)
    (compare>? compare) (> compare)
    (= compare)))
