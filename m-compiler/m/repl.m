;; The M repl.
(defn repl global-env heap index resolved
  (do line
    (then-run
      (ostream.write stdout (car (symbol >)))
      (istream.readln stdin))
    (if (symbol.= (filter line (compose not whitespace?)) ())
      (impure ())
      (let !? (char.= (car line) (car (symbol "!")))
           expr (repl-parse (concat (symbol "(def it ") (append (if !? (cdr line) line) close-parentheses)) index)
        (do pair (mpm-resolve-generate-result' resolved (generate-expr expr default-local-env global-env))
          (let new-heap (repl-interpret-declarations (second pair) heap)
               value (repl-interpret-operation (second pair) new-heap)
            ((if !? then-run-with with) value
            (fn v
              ((const repl) (debug v)
                (global-env.with-globals
                  (tree-map.remove (global-env.globals (generated.global-env (second pair))) (symbol "it"))
                  (generated.global-env (second pair)))
                new-heap
                (nat.inc index)
                (first pair))))))))))

;; Parses a line in the repl.
(defn repl-parse line index
  (parse-expr
    (append line linefeed)
    (mangle-fn-name (symbol "repl") index)
    (position index nat.1)
    (fn expr path input position
      expr)))

;; Interprets declarations in the repl.
(defn repl-interpret-declarations result heap
  (interpret-declarations (generated.declarations result) heap))

;; Interprets an operation in the repl.
(defn repl-interpret-operation result heap
  (interpret-operation (generated.operation result) heap))