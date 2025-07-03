script({
  title: "Use Z3 tool to solve SMT2 problems",
  tools: "z3",
});

$`Solve the following problems using Z3:


Problem 1:
(declare-const a Int)
(declare-fun f (Int Bool) Int)
(assert (< a 10))
(assert (< (f a true) 100))
(check-sat)


Problem 2:
(define-fun-rec length ((ls (List Int))) Int
   (if ((_ is nil) ls) 0 (+ 1 (length (tail ls)))))

(define-fun-rec nat-list ((ls (List Int))) Bool 
   (if ((_ is nil) ls)
       true
       (and (>= (head ls) 0) (nat-list (tail ls)))))

(declare-const list1 (List Int))
(declare-const list2 (List Int))
(assert (> (length list1) (length list2)))
(assert (not (nat-list list2)))
(assert (nat-list list1))
(check-sat)
(get-model)
`;
