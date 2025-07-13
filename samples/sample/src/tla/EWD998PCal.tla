------------------------------- MODULE EWD998PCal -------------------------------
(***************************************************************************)
(* TLA+ specification of an algorithm for distributed termination          *)
(* detection on a ring, due to Shmuel Safra, published as EWD 998:         *)
(* Shmuel Safra's version of termination detection.                        *)
(* https://www.cs.utexas.edu/users/EWD/ewd09xx/EWD998.PDF                  *)
(***************************************************************************)
EXTENDS Integers, Bags, BagsExt

CONSTANT N
ASSUME NAssumption == N \in Nat \ {0} \* At least one node.

Node == 0 .. N-1

Initiator == 0 \* Any node can be the initiator; 0 has just been conveniently choosen to simplify the definition of token initiation.

(********
--algorithm ewd998 {

  variables
    (*
        Although we know the relationship between the counter and network, modeling network as a set of messages would be too cumbersome.
        We have two alternatives for modeling the network: as a bag of messages or as a sequence of messages. Although modeling it as a
        sequence may seem more intuitive, we do not require its ordering properties for our purposes. Therefore, we have decided to use a
        bag to represent the network. It's worth noting that Distributed Plucal refers to this concept as a "channel".
    *)
    network = [n \in Node |-> IF n = Initiator THEN SetToBag({[type|-> "tok", q |-> 0, color |-> "black"]}) ELSE EmptyBag];

  define {
    (*
      The passMsg operator is not implementable -at least not without using extra synchronization- because it atomically reads a message
      from the nic's in-buffer and writes to its out-buffer!
    *)
    passMsg(net, from, oldMsg, to, newMsg) == [ net EXCEPT ![from] = BagRemove(@, oldMsg), ![to] = BagAdd(@, newMsg) ]
    sendMsg(net, to, msg) == [ net EXCEPT ![to] = BagAdd(@, msg) ]
    dropMsg(net, to, msg) == [ net EXCEPT ![to] = BagRemove(@, msg) ]
    pendingMsgs(net, rcv) == DOMAIN net[rcv]
  }

  fair process (node \in Node) 
    variables active \in BOOLEAN, color = "black", counter = 0;
  {
l:  while (TRUE) {

      either { \* send some payload message to some other node.
        when active;
        with (to \in Node \ {self}) {
          network := sendMsg(network, to, [type|-> "pl"]);
        };
        counter := counter + 1

      } or { \* receive a payload message. Reactivates the node.
        with (msg \in pendingMsgs(network, self)) {
            when msg.type = "pl";
            counter := counter - 1;
            active := TRUE;
            color := "black";
            network := dropMsg(network, self, msg)
        }

      } or { \* terminate the current node.
        active := FALSE

      } or { \* pass the token to the next node.
        when self # Initiator;
        with (tok \in pendingMsgs(network, self)) {
            when tok.type = "tok" /\ ~active;
            network := passMsg(network, self, tok, self-1, [type|-> "tok", q |-> tok.q + counter, color |-> (IF color = "black" THEN "black" ELSE tok.color)]);
            color := "white";
        }

      } or { \* Initiate token.
        when self = Initiator;
        with (tok \in pendingMsgs(network, self)) {
            when tok.type = "tok" /\ (color = "black" \/ tok.q + counter # 0 \/ tok.color = "black");
            network := passMsg(network, self, tok, N-1, [type|-> "tok", q |-> 0, color |-> "white"]);
            color := "white";
        }
      }
    }
  }
}
********)
\* BEGIN TRANSLATION (chksum(pcal) = "4d658e04" /\ chksum(tla) = "530581e3")
VARIABLE network

(* define statement *)
passMsg(net, from, oldMsg, to, newMsg) == [ net EXCEPT ![from] = BagRemove(@, oldMsg), ![to] = BagAdd(@, newMsg) ]
sendMsg(net, to, msg) == [ net EXCEPT ![to] = BagAdd(@, msg) ]
dropMsg(net, to, msg) == [ net EXCEPT ![to] = BagRemove(@, msg) ]
pendingMsgs(net, rcv) == DOMAIN net[rcv]

VARIABLES active, color, counter

vars == << network, active, color, counter >>

ProcSet == (Node)

Init == (* Global variables *)
        /\ network = [n \in Node |-> IF n = Initiator THEN SetToBag({[type|-> "tok", q |-> 0, color |-> "black"]}) ELSE EmptyBag]
        (* Process node *)
        /\ active \in [Node -> BOOLEAN]
        /\ color = [self \in Node |-> "black"]
        /\ counter = [self \in Node |-> 0]

node(self) == \/ /\ active[self]
                 /\ \E to \in Node \ {self}:
                      network' = sendMsg(network, to, [type|-> "pl"])
                 /\ counter' = [counter EXCEPT ![self] = counter[self] + 1]
                 /\ UNCHANGED <<active, color>>
              \/ /\ \E msg \in pendingMsgs(network, self):
                      /\ msg.type = "pl"
                      /\ counter' = [counter EXCEPT ![self] = counter[self] - 1]
                      /\ active' = [active EXCEPT ![self] = TRUE]
                      /\ color' = [color EXCEPT ![self] = "black"]
                      /\ network' = dropMsg(network, self, msg)
              \/ /\ active' = [active EXCEPT ![self] = FALSE]
                 /\ UNCHANGED <<network, color, counter>>
              \/ /\ self # Initiator
                 /\ \E tok \in pendingMsgs(network, self):
                      /\ tok.type = "tok" /\ ~active[self]
                      /\ network' = passMsg(network, self, tok, self-1, [type|-> "tok", q |-> tok.q + counter[self], color |-> (IF color[self] = "black" THEN "black" ELSE tok.color)])
                      /\ color' = [color EXCEPT ![self] = "white"]
                 /\ UNCHANGED <<active, counter>>
              \/ /\ self = Initiator
                 /\ \E tok \in pendingMsgs(network, self):
                      /\ tok.type = "tok" /\ (color[self] = "black" \/ tok.q + counter[self] # 0 \/ tok.color = "black")
                      /\ network' = passMsg(network, self, tok, N-1, [type|-> "tok", q |-> 0, color |-> "white"])
                      /\ color' = [color EXCEPT ![self] = "white"]
                 /\ UNCHANGED <<active, counter>>

Next == (\E self \in Node: node(self))

Spec == /\ Init /\ [][Next]_vars
        /\ \A self \in Node : WF_vars(node(self))

\* END TRANSLATION 

-----------------------------------------------------------------------------

token ==
    LET tpos == CHOOSE i \in Node : \E m \in DOMAIN network[i]: m.type = "tok"
        tok == CHOOSE m \in DOMAIN network[tpos] : m.type = "tok"
    IN [pos |-> tpos, q |-> tok.q, color |-> tok.color]

pending ==
    [n \in Node |-> IF [type|->"pl"] \in DOMAIN network[n] THEN network[n][[type|->"pl"]] ELSE 0]

EWD998 == INSTANCE EWD998

EWD998Spec == EWD998!Init /\ [][EWD998!Next]_EWD998!vars \* Not checking liveness because we cannot easily define fairness for what ewd998 calls system actions.

THEOREM Spec => EWD998Spec

-----------------------------------------------------------------------------

Alias ==
    [
        network |-> network,
        active |-> active,
        color |-> color,
        counter |-> counter,
        token |-> token,
        pending |-> pending
    ]

StateConstraint ==
    \A i \in DOMAIN counter : counter[i] < 3

=============================================================================
