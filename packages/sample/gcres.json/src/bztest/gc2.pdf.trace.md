## pdf-to-tweet



<details id="📄-spec" class="genaiscript">
<summary>
📄 spec
</summary>


```markdown
# Specification
                
-   [gc2.pdf](./gc2.pdf)
```

</details>



<details id="💾-script" class="genaiscript">
<summary>
💾 script
</summary>



<details id="🧬-prompt" class="genaiscript">
<summary>
🧬 prompt
</summary>



<details id="📓-script-source" class="genaiscript">
<summary>
📓 script source
</summary>


```js
script({
    title: "generate a tweet from a pdf file"
})

def("DOCS", env.files) // contains some pdfs

$`Given the paper in DOCS, generate a 140 character tweet that
captures the paper idea and make it interesting.`
```

</details>

-   model: gpt-4
-   temperature: 0.2
-   tokens: 12608

````markdown
DOCS:
```pdf file="src/bztest/gc2.pdf"
ROBERT M O R R I S , Editor

Compact List Representation:     actually reduce memory requirements by permitting very
flexible memory allocation. The design phase of any large
Definition, Garbage Collection,
programming project is incomplete without consideration
of plexes as a form of data representation and plex proces-
and System Implementation
sing as a programming technique.
Too frequently, computer science literature reports the
capabilities of a system without reporting the implementa-
tion techniques, even though the latter are more likely to
WILFRED J. HANSEN*
apply to the design of other systems. This situation has
Stanford University, t Stanford, California
been improved for plex processing by D. Knuth; [3]
provides excellent descriptions of numerous plex processing
techniques. Good reviews of the literature and further
Compact lists are stored sequentially in memory, rather than
references are in [10], [1], and [4]. Interesting projects are
chained with pointers. Since this is not always convenient, the
reported in [8] and [11], the latter being part of SDC's
Swym system permits a list to be chained, compact, or any
TM-3417 series describing the Lisp 2 implementation for
combination of the two. A description is given of that list
the I B M 360. The full Swym report [2] details the storage
representation and the operators implemented (most are
management alternatives for implementing the plex
similar to those of LISP 1.5). The system garbage collector
processing facilities of a higher-level language.
attempts to make oil lists compact; it relocates and rearranges
While investigating graphic applications of plex proces-
all of list storage using temporary storage. This unique list-
sing, the Stanford Graphics Project developed a list
compacting garbage collection algorithm is presented in de-
representation--called compact lists--that can reduce
tail. Several classes of the macros used to implement the sys-
storage requirements by up to half. To experiment with this
tem are described. Finally, consideration is given to those
new representation, the Swym plex processing system was
design factors essential to the success of a plex processing
implemented. A report is given here on the techniques of
system implementation.
that implementation and some experimental results. The
KEY WORDS AND PHRASES: data structure, data representation, list struc-
focus is on the Swym garbage collector because it is a
ture, llst representation, list, compact llst, garbage collection, relocation,
vital part of the system and employs a unique algorithm.
storage reclamation, macro, primitive list operations, plex processing,
The difference between conventional list representations
plex, pointer, llst processing system, LISP, free storage
and compact lists parallels the difference between the
CR CATEGORIES: 3.49, 4.20, 4..22, 4.49, 4.9
I B M 650 and most other computers. 650 instructions had
two address fields: one for the operand and one for the next
instruction. Most other computers save memory by as-
I n t r o d u c t i o n
suming that the instructions are sequential. When the
A plex1is a collection of data items stored in one or more
instruction sequence is broken, a "branch" instruction
locations of memory. Manipulation of such collections as
continues execution elsewhere. Like the 650, many list
entities is called plex processing and is characterized by
representations use two pointers for each element of a
the following: (1) a data item may be a pointer (the address
list: one to the element and one to the rest of the list. On
of a plex), and (2) plexes are created and discarded during
the other hand, list storage can be conserved by storing
execution. Plex processing can simplify programming and
lists sequentially in memory; then only the pointers at the
elements are required. But if that is the only way lists can
The work reported here was supported in part by the National
be stored, certain list operations will be time-consuming.
Science Foundation, Grant GP-7615.
The Swym solution is to allow a "list branch" pointer.
* Present address: Applied Mathematics Division, Argonne Na-
Lists are normally sequential, but when a list cannot be
tional Laboratory, Argonne, Illinois.
t Department of Computer Science, Stanford Graphic Project.
sequential, it is continued with a "list branch" pointer.
1This term was coined by D. T. Ross [9], who used it to represent
Figure 1 illustrates several list structures in both the old
a collection of "n-component elements" connected by pointers.
and new representations. Note that a "list branch"
Common usage (and this paper) calls an n-component element a
pointer is called a r s t pointer because it points to the rest
plex and a collection of these a plex structure. A list is one form
of plex structure.
of the list. In Section 1 a description is given of the details

Volume 12 / Number 9 / September, 1969 C o m m u n i c a t i o n s of t h e ACM 499

-------- Page Break --------

Usual Representation Compact Representation
internal structure. Note that lists are specially distin-
. . r ; - l ~ - q -"r~-T~-~3 I A i B I®~1
guished plex structures because the garbage collector can
compact them.
Swym list words have the format shown in Figure 2a.
If the r s t bit is zero, the word points at an element of the
list. If the r s t bit is one, this pointer is a so-called "list
branch" pointer; it points not at an element of the list but
at the continuation of the list. The atom bit is one in a
pointer at an atom. This is the distinguishing characteristic
of an atom in the Swym system. If both the atom and r s t
All Possible Mixed RepreseIltations of C:
bits are zero, the pointer points at a sublist of the given
=,, B I c I / " I I A I B I ® ~ I ~ ' L C - ~
list. If both the atom and r s t bits are one, the end of the
I . A pointer at an atom is represented by a character string. (Tile 'prink nanle i of the atom.)
list has been reached. A list ending with a pointer at the
2. A qist branch' pointer is indicated by (~) (fOr rst).
atom NIL is a normal list; otherwise, it is what in LIsP
5. ~ - ~ is written ~ to indicate the end of a normal list.
1.5 is sometimes called a general s-expression. The atom
4, Any otber rs._~pointer at an atom is the end of a 'general s-expression' list.
NIL is treated as a list with no elements.
F I G . 1. Comparison of usual and compact list representations
Associated with each atom is an atomhead--a word
containing the type of the atom and two marking bits for
the garbage collector. Two atom types have been imple-
of the compact list representation. In Section 2 the basic
mented: LisP 1.5 atoms (called symbols) and bit-string
operations on such lists are defined.
atoms. There are three subtypes of the latter: character
When storage is exhausted in a plex processing system,
strings, numbers, and hexadecimal numbers. Other atom
a garbage collector is called to find all active storage and
types may be defined simply by coding the primitives to
make all inactive storage awilable for use. The Swym
create, manipulate, and garbage collect each new atom
garbage collector converts ordinary lists to compact lists
type. The format of an atomhead is shown in Figure 2b.
whenever it can. In this process, all active storage is
The twenty-two unused bits may be used for different
rearranged and relocated at the low end of the plex free
storage area. Two versions of the central garbage collection
routine are presented in Sections 3 and 4. The first illus-
a. List Word
trates the basic principles; the second includes all details.
V [ Address f,e,~ I I I
An earlier system permitting compact lists intermixed
0 1 29 30 51
with chained fists has been reported by N. Wiseman [12].
Reserved for Atom bit
This system provides for the creation of compact lists, but
Garbage Collector (M1) I
I
the garbage collector does not rearrange storage t o remove
rs.~. bit
also used by
r s t pointers. Unlike Swym, variables may point at rst
Garbage Collector (M2)
pointers and there may be more than one r s t pointer
b. Atom Head
between element pointers. But the user must program
extra checking to avoid treating rst pointers as list
I I [ ~ypo I ll [ f
pointers. Wiseman presents no data on the effectiveness of
alw ys 1 in an
his system.
atom head
Finally, in Sections 5 and 6 an outline is given of the
Type of atom
Res ved for Reserved for
Garbage Collector (M1) Garbage Collector (M2)
major techniques used in implementing Swym. Macro
instructions made the system easier to write, easier to
FIG. 2. Formats of Swym internal eneodings
modify, and easier to read than if it were written entirely
in assembly language. Several classes of the Swym imple-
purposes for different atom types. For bit-string atoms,
mentation macros are described in Section 5. In Section 6
they contain the subtype and the length of the string. For
there is a discussion of the major principles which must be
symbols, they contain information about the content of
considered in the design of a plex processing system
the property list.
implementation.
Because free storage is one contiguous block, new plex
1. S w y m S t r u c t u r e s
structure is created from one end of that block. This
storage allocation scheme has proved advantageous in the
To illustrate Swym capabilities, an interpreter was
Cogent system [9]. Lists can be created in compact form
implemented for a subset of LisP 1.5 [5]. Very complex
if all their elements are known. Atoms of any size can easily
plexes can be realized under Swym, but in this section we
be created; for example, bit-string atoms are always stored
consider only those required for the interpreter: lists and
in consecutive bytes. Note that the garbage collector re-
atoms. A list is a sequence of pointers. Each pointer is the
quires only two bits in the atomhead; all other words in an
address of an element of the list. An element, in turn, can
atom structure may be full words.
be either a list or an atom. An atom is a plex with arbitrary

500 C o m m u n i c a t i o n s of t h e ACM Volume 12 / N u m b e r 9 / September, 1969

-------- Page Break --------

Most of these operators are implemented in a straight-
Swym was originally designed for a 360/67 with 32-bit
forward manner. The operators fst, r p l f , a t o m , and n u l l
addresses; but three nonaddress bits are available in every
require 1, 1, 3, and 2 instructions, respectively, c o n s is
pointer. T h e low-order two bits are available because they
always a subroutine call because it is lengthy and infre-
are always zero in a pointer at a full word. The high-order
quently used by the system. A special subroutine linkage
bit is available because negative addresses are impractical
requiring five instruction-executions calls c o n s . The rou-
- - t h e y are algebraically smaller, though topologically
tine itself requires six instruction-executions unless the
larger, than positive addresses. This discontinuity requires
garbage collector is called.
extra code in all address computations if the program might
Unlike any other routine, r s t invokes out-of-line code
be loaded across the address boundary.
with a simple BAL (Branch And Link). This code is in a
A pointer at an atom points six bytes in front of the
section of the system t h a t is always addressable. A call on
atomhead. This assures that the atom bit is one in a
r s t is:
pointer at an atom. At the same time, operators on atoms
BAL L, R S T
can address the atom directly without masking the atom
At this point, the pointer whose r s t is to be taken must be
bit. F r o m a paged-memory standpoint, the atom bit has a
in register X. At location RST, the code is:
small advantage: whether or not an element is an atom can
be decided without accessing t h a t element. A major
R S T T M 7 ( X ) , X ' 0 1 ' test
r s t bit
advantage of the atom bit is that
f s t a n d r s t both cause an
BO RST1 branch if one
interrupt if their argument is an atom. The advantages of
B X H X , C 4 , 0 ( L ) iner X by 4 and return
the atom bit suggest its use even in a 24-bit address
RST1 L X , 4 ( X ) pick up r s t pointer
B C T R X , L turn off r s t bit and return
machine.
Register L is a standard linkage register. Register C4 is an
2. B a s i c O p e r a t o r s
odd register containing 4. The result of r s t is left in
register X. Either the B X H has added 4, so that X points
The basic Swym operators are direct counterparts of the
at the next location of memory, or the L has loaded the
basic Lisp operators, though the mnemonics were changed
next location of memory. Note t h a t in the latter case the
as an advance beyond the IBNI 704. Each operator exists
B C T R turns off the r s t bit. If X points to an atom, r s t
in two forms: first, as a routine which can be called from
will cause a program interrupt: the L is attempted because
an interpreted function; second, as a macro which can be
the T M detects the "1" in the middle of the atomhead.
coded in assembly language or compiled b y a compiler.
This is why an atom pointer points six, not two, bytes in
This second form is the main consideration below; only
front of the atomhead. To avoid register transfers, there
operators required to describe the garbage collector are
is a different r s t routine for each pointer register.
presented. A simple interpreter has been implemented,
I t is a shortcoming of compact lists that the operation
providing the capabilities of basic LmP (without PROG).
r p l r is not allowed (this would correspond to the Lisp
f s t (/)--returns the first element of the list g (corresponds
operation R P L A C D ) . This is because there is not always
to Lisp 1.5 CAR). Processing is interrupted if g is an
a r s t field to be replaced. As a result, lists cannot be sorted
atom.
b y changing the links between the elements. One possibility
r s t (l)--returns the rest of the list l beyond the first
is to chain lists in the f s t direction and use r p l f to change
element (corresponds to Lisp 1.5 CDR). The program
the order of the list. B u t this makes for unnatural list
is interrupted if l is an atom.
structures and nonintuitive coding. A possible solution is
c o n s (e / ) - - c o n s t r u c t s a new list by adding the element
the introductior~ of the atom type true-list, a list with
e in front of the list 1. Returns a pointer to a new list
explicit r s t pointers. Whenever a true-list is created, it is
ll such that f s t (11) is e and r s t ill) is 1. If free storage
placed on a special list of all such atoms. The first task of
is exhausted, c o n s calls the garbage collector. ( c o n s
the garbage collector is to mark all elements of all true-
takes two words from free storage: a pointer at e and a
lists so they will not be collected by other routines. The
r s t pointer at l.)
marking bit m l can be used for this function because
r p l f (1, e)--replaces the first element of 1 with e (corre-
C O L L E C T ignores any structure marked with that bit.
sponds to Lisp 1.5 RPLACA). This is accomplished by
Another possible solution to the problem posed by r p l r is
changing the list l (by storing a pointer to e in place of
to extend the notion of the r s t pointer. E v e r y time a
the pointer to fst(l)). The result returned b y r p l f is l,
pointer is used it is checked to see if it points at a
r s t
but fst(1) is different, rst(/) is unchanged.
pointer. If so, the r s t pointer replaces the pointer in
a t o m @)--This predicate tests whether x is an a t o m . To
question. B u t this solution greatly increases all list access
the interpreter, the result is either the atom T or the
time.
atom NIL, for true or false, respectively. For the result
On the surface, it might appear that arrays are possible
of a predicate macro, see Section 5.
as a direct extension of Swym compact lists. A list guaran-
n u l l (x)--This predicate tests whether its argument is the
teed to be compact could be referenced b y direct-address
atom NIL, returns results in' the same manner as does
arithmetic. Unfortunately, problems arise: if any substruc-
a t o m .
r s t of that list, that
ture of the list includes a pointer to a

Volume 12 / Number 9 / September, 1969 C o m m u n i c a t i o n s o f the ACM 501

-------- Page Break --------

rst will be collected before the preceding portion of the list.
meats of t h a t list. When a list is written to new core, the
As with true-lists, a possible solution is the creation of a contents of t h a t list must be the new core addresses of the
special type of atom called the list-array, a list with no rst
elements of t h a t list. Consequently, the elements of a list
pointers. When a list-array is created, it is put on a special
must be C O L L E C T e d before the list itself can be written
list. The first task of the garbage collector is then to mark
to the new core. C O L L E C T (x) proceeds in two recursively
all list-arrays so they will be collected linearly. Again, the
intertwined passes. T h e first pass applies C O L L E C T to
m l bit could be used.
each element of the list x. The second pass writes the new
representation of the list x to the new core image. To
3. Basic Garbage Collector A l g o r i t h m
remember where a piece of list structure is in new core, its
The Swym garbage collector creates a set of structures
f s t is replaced (rplf) with the address of t h a t structure in
isomorphic to all active structures with respect to r s t and
new core. The head of an atom is used to store the address
fst. Most rst pointers are eliminated. This set of structures of that atom in new core.
is in a new core image, created sequentially and written to a
Three operators must be defined in order to describe the
temporary storage device. After collecting all active struc- garbage collector:
tures, the new core image is read into one end of the plex
A T C O L
(x)--x must be an atom. If x has not been garbage
storage area. The remainder of t h a t area becomes the free
collected, it is collected and written to the new core
storage area so t h a t plexes of arbitrary size m a y be allot
image. The atomhead of x is replaced with the address
cated as required.
of x in the new core. A T C O L calls separate routines to
An M I T memorandum by h~insky [6] influenced the
garbage collect each type of atom.
design of the Swym garbage collector. H e suggested both
G C P U T (x)--x is any full word. This word is written to the
the use of temporary storage and the possibility of rear-
next available location in the new core image. The value
ranging lists so t h a t the rst points to the next location of
of G C P U T is the address of t h a t location. An internal
memory. Without suggesting compact lists, he remarks,
variable is advanced to point at the next available loca-
" T h e r e are probably some important applications of (such
tion in the new core image. G C P U T handles I / O and
rearranged lists)." But Minsky's algorithm does not work
writes buffers to the external device when necessary.
for even the simplest cases (for example, the structure of
H D
(x)--x must be an atom. H D returns its atomhead;
Figure 4). The Swym garbage collector works for not only
after ATCOL, the atomhead contains a pointer to x in
the simplest cases but also the most complex cases of
the new core. If x is nonatomic, processing is interrupted.
mutual circularity. The complete garbage collector is
T h e basic garbage collection algorithm is given in Figure
described in Section 4; in the present section we give a
3 in a notation derived from ALGOLand Lisv M-expressions.
minimal version of the garbage collector to illustrate the
The declarator list declares a variable which m a y point
central ideas. This minimal version is satisfactory only for
at a piece of list structure. The declarator w o r d declares a
structures t h a t never have more t h a n one pointer at any
variable whose value is one full word. Note t h a t r s t b i t is
given word of the structure.
initialized to the value 1. This corresponds to the value of
C O L L E C T (x), the portion of the garbage collector
a word with just the rst bit on. r s t b i t is used to
"or" the
presented both here and in Section 4, has as its argument
rst bit into a word written to the new core image. The
a pointer at a piece of list structure. I t then writes t h a t list
result of applying C O L L E C T to a simple structure is
structure sequentially to the new core image. Other func-
shown in Figure 4.
tions must be written to call C O L L E C T for each possible
"Garbage collection" is truly a misnomer for this
pointer at active structure, to collect atoms, and to read
algorithm. C O L L E C T examines only the active list struc-
in the new core image.
tures, while the garbage is completely ignored and has no
The contents of a list are address pointers to the ele-
effect on the processing. "Storage reclamation" describes
the process no better. Possibly better terms might be
C O L L E C T (x) = b e g i n l i s t r, t; w o r d rstbit : = xl00000001t;
"storage reorganization" or "garbage control." B u t the
c h k l o o p : t : = f s t ( r ) ;
term "garbage collection" is so widely used and so colorful
i f a t o m ( t ) t h e n A T C O L (t) e l s e C O L L E C T (t);
as to preclude replacement.
t : = r s t ( r ) ;
i f a t o m ( t ) t h e n A T C O L (t)
4. T h e C o m p l e t e Garbage Collector A l g o r i t h m
e l s e b e g i n r : = t; g o t o c h k l o o p e n d ;
T h e simple garbage collector above is inadequate for
w r l o o p : t : = f s t ( r ) ;
many common list structures: circular lists, several lists
t h e n G C P U T ( H D (t))
r p l f (r, i f a t o m (t)
with the same rst, a structure which is an element of more
e l s e G C P U T ( f s t ( t ) ) ) ;
t h a n one list, and more pathological cases. T h e imple-
t :---- r s t (r);
mented garbage collector handles all possible cases with
i f a t o m (t) t h e n G C P U T ( H D ( t ) V rstbit)
e l s e b e g i n r : = t; g o t o w r l o o p e n d
marking bits and a fixup table.
e n d
C O L L E C T
Two marking bits are associated with each list word.
Each pass sets a marking bit to indicate it has visited a
FIG. 3. S i m p l i f i e d C O L L E C T a l g o r i t h m

502 C o m m u n i c a t i o n s o f t h e ACC~VI                     V o l u m e 12 / N u m b e r 9 / S e p t e m b e r , 1969

-------- Page Break --------

Initial Structure:
given word. The first pass sets bit m l , the second sets m2.
Special action must be taken when a marked word is en-
encountered, because t h a t word is already being processed
at some other level of recursion. A word with m 2 set always
contains the address of the corresponding word in the new
core image.
Several functions set and test the marking bits:
MARK1 (w) The word pointed at by w is marked
with m l .
At wrloop on the highest revel:
MARK12 (w) The word pointed at by w is marked
with both m l and m2.
Old Memory
U N M A R K 1 (w) m l is turned off in the word pointed
at by w.
M1 (w) This predicate is t r u e if m l is on in
the word pointed at by w.
M2 (w) This predicate is t r u e if m 2 is o n in
the word pointed at by w.
i /
Conceptually, each of these functions tests its argument to
- ¢ I
• J
see if it points at an atom, and adjusts the addressing
New Memory ~ I Ii
appropriately. In practice, it is known a priori whether
~ t ,
the argument is an atom, and a bit macro (see Section 5)
is coded instead of a function call.
In circular structures, a word points at some structure
already being collected at some higher level of recursion
( m l is set, but not m2). T h a t word cannot be written
At completion:
correctly to the new core image because its contents are
Old Memory
not determined. In most reasonable applications, the
number of such circularities is well below one percent of
the number of pointers. Nonetheless, some provision must
be made to handle this case; in Swym, the garbage collector
uses a ffixup table. When the correct new contents cannot
! I | /
I / ~ - - - q r - - J )
be determined, a word of zeros is written to the new core
I f 1 - ~ [ - Fk - . . . . . . . . . . . . .
and an entry is made in the fixup table. Each entry is two
a I I I
pointers. The first points at the word of zeros in the new
\ ] I I I i
core; the second points at the word in old core which will
New I j I 1 I • It
Me-~ory I I I I f ! I
eventually contain the correct address to substitute for
the word of zeros. After C O L L E C T is fiifished, the second
] .... la.-d ' TI .... ~ ] , . , w l , ° . ~ f IDn.] ! [~]
pointer of each fixup entry is replaced by the contents of
h J < \~ Y ..I/
the word it points at. Then, after the new core image has
been read in, the fixups are applied; i.e. the second word of
N o r e : , new pointer
the entry is "or"ed into the location indicated by the first
- - pointer unchanged from preceding diagram
word of the entry. (The "or"ing permits the word of
. . . .. . . . }pointerbeenreadat in.l°cati°n a word will occupy after the new core image has
zeros to have the r s t bit on if required. The fixup procedure
thus works for both f s t and r s t fixups.)
Fxe. 4. Effect of COLLECTing a simple structure, assuming a l l
atoms have already been collected. At completion, the new core
One new function must be defined to describe the com-
address of the corresponding structure is in fst(x).
plete garbage collector:
F I X U P (p,c)--the word c (either zero or r s t b i t ) is
The complete garbage collector is given in Figure 5. The
G C P U T to the new core. An entry is made in the fixup
argument x must be a pointer at a list structure with
table consisting of the address returned by G C P U T and
neither marking bit on. C O L L E C T has no value, but the
the pointer p.
new core address of the list corresponding to x is stored in
The function A T C O L defined in Section 3 must be ex-
place of the pointer to fst(x). A demonstration t h a t this
tended. When A T C O L is entered, the m l is set in the
algorithm creates a correct representation of its argu-
atomhead. After collecting the atom, both marking bits
ment is given in [2]. The U N N I A R K i ( r ) and the Boolean
are set. Since C O L L E C T may be called for some substruc-
variable m are related. The former indicates the need for a
ture of an atom, provision is made for a pointer at an atom
fixup in the r s t direction; the latter detects this need in
with m l and not m 2 (a fixup entry is generated).
the second pass. In Figure 5, the marking bits are assumed

V o l u m e 12 / Number 9 / September, 1969 Communications of the ACM 503

-------- Page Break --------

dividing execution time into amount of active storage. The
to be associated with each word. and not part of the word.
experimental system did not use external storage; instead,
This association could be by extra bits in the hardware or
memory was shuttled between two alternate core areas.
by a bit table in a separate area of memory. The former
Thus the time to write out memory is the maximum of the
requires hardware modification, while the latter requires
time to write out the active structure and the time to
six percent more memory. In the implemented system,
execute 40 instructions for each active word. The time to
the marking bits are in the list words themselves, as shown
read in memory is dependent solely on the number of
in Figure 2. Figure 5 must be modified for these bit assign-
active words.
meats by turning off the marking bits in the arguments to
Several applications for the Swym garbage collector are
GCPUT and replacing
conceivable, even apart from compact list structure. The
t : = r s t (r)

Initial Structure:
with
i f Ml(r-t--4) t h e n t : = r -4- 4 e l s e t : = r s t ( r )
X : -
Diagrams of the effect of COLLECT on a complex struc-
ture are shown in Figure 6.
Some limited experiments have been conducted with the
Swym garbage collector. On one list structure, representing
a program, there was a 25 percent saving of storage using
At ~rloop on the highest level:
compact lists instead of standard lists. This corresponds to
Old Memory
an average list length of only two elements. The corre-
spondence is easy to compute. A normal list of length n
requires 2n pointers. The corresponding compact list re-
quires n + 1 pointers, for a saving of 1 --((n + 1)/2n);
when n is 10, the saving is 45 percent. Every symbol
Fixup Table
atom takes at least four words of storage plus the length
of the print name; so the number of symbol atoms is also a
factor.
For every active word of storage, 40 instructions were
executed during garbage collection. This was computed by
I

New Memor~
C O L L E C T (x) = b e g i n l i s t r, t; B o o l e a n m;
rstbit : = x'00000001';
w o r d
r : - ~ X;
At exit from COLLECT:
chkloop: c o m m e n t Loop to collect each f s t ;
: = f s t ( r ) ; M A R K I ( r ) ;
t
Old Memory
i f
a t o m ( t ) t h e n A T C O L ( 0 e l s e i f m 1Vfl(t) t h e n C O L L E C T
(t);
c o m m e n t T e s t for e n d of list or r e a c h e d m a r k e d word;
: = r s t ( r ) ;
t
t . _ _ " . . . . . . ,
a t o m ( i ) t h e n A T C O L (t)
i f
FixopTahle ' - - " i i
e l s e i f 1V~2(t) t h e n
' '
i f Ml(t) t h e n U N M A R K 1 (r)
e l s e
I I
e n d ;
e l s e b e g i n r := t; g o t o ehklo0p
I
r : = X;                                                  , , , , , ; ',
wrloop: c o m m e n t Loop to write o u t each new f s t ;                                       !
I
: = f s t ( r ) ;
m := M l ( r ) ; t
a t o m ( t ) t h e n
r p l f (r, i f
I / i i
New Memory
i f M2 (~) t h e n G C P U T (HD(0) e l s e F I X U P
T * v ~ #
(t, 0)
e l s e i f M2 (1) t h e n G C P U T (fst(l)) e l s e F I X U P
(t, 0));
MARK12(r) ;
Final structure after reading new core image and applying fixups:
c o m m e n t T e s t for e n d of second pass;
t : = r s t ( r ) ;
structure:
i f a t o m ( t ) t h e n
i f M2(t) t h e n G C P U T (HD(t) v rstbit)
e l s e F I X U P (t, rstbit)
e l s e i f M2(t) t h e n G C P U T (fst(t) v rstbit)
e l s e i f m t h e n b e g i n r : = ~; g o t o wrloop e n d
Fza. 6. Effect of C O L L E C T i n g a complex s t r u c t u r e . M a r k i n g
F I X U P ( t , rstbit)
e l s e
b i t s are i n d i c a t e d b y integers in t h e lower corners. T h e usuM list
e n d C O L L E C T
r e p r e s e n t a t i o n of t h e initial s t r u c t u r e would include a r s t p o i n t e r
a f t e r t h e p o i n t e r to A.
FIG. 5. Complete C O L L E C T a l g o r i t h m

5 0 4 C o m m u n i c a t i o n s o f t h e A C M V o l u m e 12 / N u m b e r 9 / S e p t e m b e r , 1969

-------- Page Break --------

Swym garbage collector could be valuable in a system with
code instructions in terms of t h a t specification. Tile Swym
roll out and roll in. If the monitor set a signal for the pro-
bit macros provide this facility--the macro B I T declares a
gram to roll itself out, the program could garbage collect
mnemonic to represent a bit in a field. The macros SET-
for free the next time a c o n s was executed. The garbage
B I T , R E S E T B I T , I N V R T B I T , and T E S T B I T accept as
collector would be valuable in a paging environment be-
arguments the name of a register pointing at a field in
cause it tends to localize list structure. External storage of
memory and the name of a bit. The first three affect the
structures has always been a problem for plex processing
state of the bit; T E S T B I T is a predicate m a c r o - - i t tests
systems. The Swym garbage collector provides an algo-
the bit's state.
rithm for scanning lists and storing them in a compact form
The byte-immediate instructions are used to implement
on an external device. Another application for this algo-
these macros. One instruction is assembled for each macro
(two for T E S T B I T ) . The B I T definition is preserved in
rithm is in the transmission of list structures between two
machines over a slow channel. If the new storage is written
a pair of assembly-time global arrays.
starting at location zero, the address fields can be small.
T h e garbage collection algorithm frequently makes a
Only as the size of the structure passes a power of two
test and then executes one of two alternate pieces of code.
would the length of each address field have to increase.
In higher-level languages, such constructions are usually
The implemented garbage collector stores partially col-
expressed as conditional statements in the form:
lected structures on the stack but uses a trick to avoid    i f (predicate) t h e n (true part) else (false part)
The advantage of this kind of language facility is that it
saving return addresses during recursion. I t would be
makes clear that one of two alternate paths will be exe-
possible to use the WisP technique [10] to avoid using the
cuted. In conjunction with proper indentation, this facility
stack during collection. This was not done because it would
contributes greatly to the reader's comprehension of the
involve at least two more passes over the data. In a
program. To provide this convenient high-level language
memory-sharing environment, it is sometimes possible to
structure in assembly language, a set of macros was imple-
acquire temporarily the needed extra storage for a stack;
mented for Swym.
otherwise, sufficient stack must be available to hold twice
Four macros are basic to the conditional execution
the length of the longest f s t chain.
facility: IF, T H E N , E L S E , and E N D I F . None has any
5. M a c r o s for I m p l e m e n t i n g S w y m
parameters. T h e y are used in an assembly language just as
are their counterparts in a higher-level language program:
Macros are a powerful programming tool for more
important reasons than just the reduction of the amount
IF
code for (predicate)
of writing required. Operations can be stated in terms of
THEN
the problem at hand rather than the machine at hand. Even
code for (true part)
though the macro form of many of the operators in Section
ELSE
code for (false part)
2 assembles only one instruction, it is important to use the
ENDIF
macro because the intent of the operation is clarified and
the data type of the operand is emphasized. Clarity is
The code for the true and false parts m a y be any code
important both to the interested reader and the per-
including other if-then-else sets. B u t the predicate m a y not
plexed debugger. Consistent and extensive use of macros
contain IF. I t is possible to omit the E L S E and the false
also facilitates program modification. In m a n y cases, an
part; the correct code will still be generated.
entire data representation can be modified b y changing a
The four conditional macros generate appropriate labels
few macros.
and branch instructions (given the assembler, there is no
Several classes of macros were created to facilitate the
good way to avoid labels altogether). The labels are gener-
implementation of Swym. One class has already been
ated b y the I F macro and saved on a global assembly time
described--the macros implementing the primitive func-
stack. The use of the stack permits nesting of IF's up to
tions. Another class of macros manipulates data on the
63 levels.
pushdown list: PUSH, POP, TOP, R P L T O P , etc. To
More high-level-language-like features are available
avoid excessive subroutine calls, G C P U T and F I X U P
within the predicate part. The conditions most likely to be
were also implemented as macros. T h e bit macros and the
tested for are ATOM, NULL, and T E S T B I T . Each of
conditional execution macros deserve detailed discussion.
these is implemented as a predicate macro. This assembles
These macros show the power of the 360 assembler,
a test and a conditional branch to one of the labels on top
especially the global array facility. The creation of the
of the I F stack. These macros can also be used without I F
initial contents of the plex storage area also demonstrated
b y supplying a destination label as an argument. The
the power of the 360 macros. This process involved hash
conditional branching macro P R E D B R can be used in
coding identifiers (at assembly time) to assemble list
case the provided predicates are inadequate. Before calling
structure putting those identifiers in the proper bucket of
this macro, the condition code must be set for the condi-
the OBLIST, the list of all atoms.
tion to be tested. P R E D B R ' s arguments are two op
In the 360 assembler language, a mnemonic m a y easily
codes, one to make the test for true, the other to make the
represent a specific bit within a byte. B u t there is no
test for false (e.g. B H and B N H ) . P R E D B R chooses the
convenient way to specify a bit within a field and to then

Communications of the ACM 505
Volume 12 / Number 9 / Sel~tember, 1969

-------- Page Break --------

from the routine. Furthermore, these instructions must be
test for false unless the NOT macro has occurred. The
satisfactory for recursive routines; that is, return addresses
branch address is taken from the global IF label array and
must be saved on a stack. The Swym system has three
one instruction is assembled. All predicate macros use
routine linkage macros: one each for entry, exit, and call.
P R E D B R to do their branching. Elementary predicate
Each assembles three instructions. Altogether, execution
macros may be combined by the use of the Boolean con-
of the nine instructions requires accessing only 11~ words
nective macros AND, OR, and NOT. These macros have
of memory. This is probably the minimum required to per-
no parameters. There are no parentheses macros, and
form these necessary functions: maintain addressability
AND has higher precedence than OR.
for the calling and called routines, stack and unstack the
The macros described in this section simplified construc-
return address, and mark the return address to distinguish
tion of the garbage collector and made the result easier to
it from a pointer.
read. The code is written beginning in columns 40, 45, 50,
The Swym system supports several different variable-
55, depending on the level of nesting of IF's. This separates
binding methods, but most are beyond the scope of this
the source program from the generated code. Few com-
paper. The system itself binds variables to general registers,
ments are required because the macros are highly mne-
locations on the stack, and a special section of memory for
monic and specific to the data structure.
a few global values. General registers to be saved must be
6. F a c t o r s i n t h e D e s i g n of a S y s t e m
saved and restored by the calling routine. With this con-
I m p l e m e n t a t i o n
vention, very few registers need be saved because only
those registers with active information are saved. More-
While implementing Swym, several factors important
over, a register can be saved and more than one function
to the design of any system implementation were isolated.
called before that register is restored.
The more important of these factors can be summed up in
Because all active storage must be COLLECTed, all
two rules:
pointers must be recognizable as pointers. This is a string-
1. Optimize linkages.
ent restriction on system design. Some means must be
2. Identify pointers.
provided to determine for each word in the stack or in a
Optimization effort should be spent on the most frequent
plex whether or not it is a pointer. A word can be known
operations. In plex processing languages, the most frequent
to be a pointer either by testing special bits or by the con-
operations are not the callable operations (fst, rst, c o n s ,
text in which the word is accessed. In Swym, all list words
etc.), but the linkage operations: data access, routine
are pointers because fists can contain only pointers. I t is
linkage, and variable binding. These operations are so
simple to define atom types having pointers known to be
prevalent that serious consideration must be given to
pointers because of their position in the plex for that atom
designing them into the hardware. Each of these is dis-
type. Bits are used to distinguish pointers on the Swym
cussed below. The second rule is a result of the fact that
stack. A low-order bit of one indicates that that word is
the garbage collector must be able to find all active struc-
not a pointer. Return addresses are marked this way; they
tures. The implications of this rule are also discussed below.
point one byte in front of the return location. Blocks of
Some data representations require address decoding to
words may be allocated on the stack. Bits in the stack-
access a data element; some even require table look-up.
block head indicate which words in the block are pointers.
Since any operation on data requires accessing that data,
such time-consuming access methods mean that programs
C o n c l u s i o n
cannot run rapidly. This usually means that the program
cannot be used to attack any problems big enough to
In this paper we have discussed a new list representa-
justify the use of a computer. In plex processing, a better
tion, a garbage collector especially suited to that repre-
phrase than "data access" is "descend one level in the data
sentation, and some of the considerations involved in
structure." The Swym operators
r s t and fst descend one
designing a system implementation. The data representa-
level in the data structure and are reasonably efficient
tion has some advantages in saving space. The garbage
(rst involves at most five instruction-executions). Swym
collector has the same advantage, as well as the advantage
also provides for storing data in atoms; the components of
of putting associated information close together. These
an atom can be accessed directly if the address of the atom
advantages must be weighed carefully against the slight
is known.
amount of additional processing entailed. The most
Plex processing programs tend to execute a large number
advantageous use of these structures is in situations where
of subroutine calls; so the routine linkage mechanism must
information must be transferred; many instructions can
be efficient. While it is a waste of both time and memory
be executed in the time needed to do one word of input/
to save and restore 16 general registers every time a sub-
output. Swym demonstrates that careful attention to the
routine is called, it is sheer nonsense to call a special
overall design of a system implementation can contribute
linkage subroutine every time a subroutine is called. If
to its success.
any function of a machine is considered when that machine
Acknowledgment. The author is grateful for the advice
is designed, that function ought to be routine linkage. No
and encouragement of Professor William F. Miller.
more than two instructions should be executed to call a
subroutine: one to call the routine, and a second to exit
RECEIVED NOVEMBER, 1968; REVISED JANUARY, 1969

506 Communications of t h e ACM Volume 12 / Number 9 / September, 1969

-------- Page Break --------

REFERENCES
7. Ross, D . T . A generalized technique for symbol manipula-
and numerical calculation. Comm. ACM 5, 3 (Mar.
tion
a i d e d
1. GRAY, J. C. Compound data structure for computer
1961), 147-150.
design; a survey. Proc. ACM 22nd. Nat. Conf. 1967, Thomp-
8. . The AED free storage package. Comm. ACM I0, 8
son Book Co., Washington, D. C., pp. 355--365.
(Aug. 1967), 481--492.
o n t h e
2. HANSEN, W. J. The impact of storage management
implementation of plex processing languages. Tech. Rep.
9. REYNOLDS, J. C. Cogent programming manual.
Argonne
No. 113, Computer Science Dep., Stanford U., Stanford,
Nat. Lab. Rep. No. ANL-7022, Argonne, Illinois, Mar.
Calif., 1969.
1965.
The Art oJ Computer Programming, Vol. I.
3. K~UTH, D . E .
10. SCHORR, H., AND WXITE, W.M. An efficient machine-inde-
Addison-Wesley, Menlo Park, Calif., 1968.
pendent procedure for garbage collection in various
list
4. LANG, C. A., AND GRAY, J. C. ASP--A ring implemented
structures. Comm. ACM 10, 8 (Aug. 1967), 501-506.
Comm. ACM 11, 8 (Aug. 1968),
associative structure package.
11. STYGAR, P. LISP 2 garbage collector specifications. TM-
550-555.
3417/500/00, System Development Corp., Santa Monica,
L I S P 1.5 Programmer's Manual.
5. MCCARTHY, J., ET AL.
Calif., Apr. 1967.
MIT Press, Cambridge, Mass., 1962.
12. WISEMAN, N. E. A simple list processing package for the
6. MINSKY, M. L. A LISP garbage collector using serial sec-
PDP-7. In DECUS Second European Seminar, Aachen,
ondary storage. MIT Artificial Intelligence Memo. No. 58,
Germany, Oct. 1966, pp. 37-42.
MIT, Cambridge, Mass., Oct. 1963.

then used to translate a more elaborate one, and so forth,
A Base for a Mobile
until the desired level of complexity is reached.
This paper is a complete description of the first stage of
Programming System
such a bootstrapping procedure. I t is organized as follows:
in Section 2, the processing performed b y the simple com-
RICHARD J. OR~ASS
piler ( S I M C M P ) ; in Section 3, some examples of its use;
I B M Thomas J . Watson Research Center
in Section 4, the environment which m u s t be coded for a
Yorktown Heights, N e w York
particular computing machine; and in Section 5,
the
S I M C M P algorithm.
AND
2. S p e c i f i c a t i o n s for S I M C M P
WILLIAM
M. WHITE
University of Colorado, Boulder, Colorado
T h e algorithm described in this paper was constructed
to provide a compiler of m i n i m u m length and complexity
which is adequate to serve as the base for the implemen-
An algorithm for a macro processor which has been used as the
tation, b y bootstrapping, of programming systems.
base of an implementation, by bootstrapping, of processors
S I M C M P is essentially a v e r y simple macro processor.
for programming languages is described. This algorithm can
Source language statements are defined in terms of their
be easily implemented on contemporary computing machines.
object code translations. These definitions are stored in a
Experience with programming languages whose implementa-
table. A source p r o g r a m is translated one line at a time.
tion is based on this algorithm indicates that such a language
The input line is compared with all of the entries in the
can be transferred to a new machine in less than one man-week
table. W h e n a m a t c h occurs, the object code translation
without using the old machine.
of the input line, with appropriate p a r a m e t e r substitu-
KEY WORDS AND PHRASES: bootstrapping, macro processing, machine
tions, is punched. S I M C M P can be used to translate a n y
independence, programming languages,implementationtechniques
source language which can be defined b y means of simple
CR CATEGORIES: 4.12, 4.22
substitution macros with single character parameters.
Several terms as they are used in this paper are illu-
1. I n t r o d u c t i o n
strated here. I n a conventional macro processor, a macro
definition is of the form:
The development of m a n y special purpose programming
languages has increased the overhead associated with
M A C R O N A M E (P1, " ' " , P , )
changing computing machines and with transferring a
Code body
programming language from one computer center to
E N D
another. A n u m b e r of writers have proposed t h a t these
languages should be implemented b y bootstrapping. (Since
T h e strings ' M A C R O ' and ' E N D ' serve to delimit the
this work is well known, it is not summarized in this in-
macro definition. ' N A M E ' stands for the name of the
troduction.)
macro, and 'Pi', • "" , ' P , ' stands for the formal parameters
The description is given of a bootstrapping procedure
of the macro. This macro is called b y a line of the form
which does not require a running processor on another
' N A M E (A1, • • • , A~)' where m is less t h a n or equal to n.
machine for its implementation. A compiler is described
When this call is encountered in the p r o g r a m text, the
which can be trivially implemented " b y h a n d " on con-
code body of the macro N A M E is evaluated b y sub-
t e m p o r a r y computing machines. This simple compiler is

Volume 12 / Number 9 / September, 1969 Communications of the ACM 507
```

Given the paper in DOCS, generate a 140 character tweet that
captures the paper idea and make it interesting.
````

</details>



<details id="👾-system" class="genaiscript">
<summary>
👾 system
</summary>

-   tokens: 8

```markdown
You are concise. Answer in markdown.
```


<details id="js" class="genaiscript">
<summary>
js
</summary>


```js
system({ title: "Markdown system prompt" })
$`You are concise. Answer in markdown.`
```

</details>


</details>



<details id="👾-system.explanations" class="genaiscript">
<summary>
👾 system.explanations
</summary>

-   tokens: 9

```markdown
When explaining answers, take a deep breath.
```


<details id="js" class="genaiscript">
<summary>
js
</summary>


```js
system({ title: "Explain your answers" })
$`When explaining answers, take a deep breath.`
```

</details>


</details>



<details id="👾-system.files" class="genaiscript">
<summary>
👾 system.files
</summary>

### ❌ 


```yaml
errno: -2
code: ENOENT
syscall: open
path: ""
```
### ❌ 


```yaml
errno: -2
code: ENOENT
syscall: open
path: ""
```
### ❌ 


```yaml
errno: -2
code: ENOENT
syscall: open
path: ""
```
-   tokens: 79

``````markdown
## Files

When generating or updating files you will use the following syntax:
Make sure to use precisely ``` to guard file code sections.
Make sure to use precisely ````` to guard file markdown sections.
Use full path of filename in code section header.
If a file does not have changes, do not regenerate.
Do NOT emit line numbers in file.
CSV files are inlined as markdown tables.
``````


<details id="js" class="genaiscript">
<summary>
js
</summary>


```js
system({
    title: "File generation",
    description: "Teaches the file format supported by GenAIScripts",
})

const folder =
    env.vars["outputFolder"] || "."
$`## Files

When generating or updating files you will use the following syntax:`

def(
    `File ${folder}/file1.ts`,
    `What goes in\n${folder}/file1.ts.`,
    { language: "typescript" }
)
def(
    `File ${folder}/file1.py`,
    `What goes in\n${folder}/file1.py.`,
    { language: "python" }
)
def(
    `File /path_to_file/file2.md`,
    `What goes in\n/path_to_file/file2.md.`,
    { language: "markdown" }
)

$`Make sure to use precisely ${env.fence} to guard file code sections.`
$`Make sure to use precisely ${env.markdownFence} to guard file markdown sections.`
$`Use full path of filename in code section header.`
if (folder !== ".") $`When generating new files, place files in folder "${folder}".`
$`If a file does not have changes, do not regenerate.`
$`Do NOT emit line numbers in file.`
$`CSV files are inlined as markdown tables.`
```

</details>


</details>


</details>



<details id="🧠-llm-request-(2-messages)" class="genaiscript">
<summary>
🧠 llm request (2 messages)
</summary>

-   tokens: 12718
-   temperature: 0.2
-   api type: azure
-   model: gpt-4
-   url: [https://tnrllmproxy.azurewebsites.net/openai/deployments/gpt-4/chat/completions?api-version=2023-09-01-preview](https://tnrllmproxy.azurewebsites.net/openai/deployments/gpt-4/chat/completions?api-version=2023-09-01-preview)


<details id="✉️-messages" class="genaiscript">
<summary>
✉️ messages
</summary>


``````json
{
  "temperature": 0.2,
  "messages": [
    {
      "role": "system",
      "content": "---\nYou are concise. Answer in markdown.\n\n---\nWhen explaining answers, take a deep breath.\n\n---\n## Files\n\nWhen generating or updating files you will use the following syntax:\nMake sure to use precisely ``` to guard file code sections.\nMake sure to use precisely ````` to guard file markdown sections.\nUse full path of filename in code section header.\nIf a file does not have changes, do not regenerate.\nDo NOT emit line numbers in file.\nCSV files are inlined as markdown tables.\n\n"
    },
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "DOCS:\n```pdf file=\"src/bztest/gc2.pdf\"\nROBERT M O R R I S , Editor\n\nCompact List Representation:     actually reduce memory requirements by permitting very\nflexible memory allocation. The design phase of any large\nDefinition, Garbage Collection,\nprogramming project is incomplete without consideration\nof plexes as a form of data representation and plex proces-\nand System Implementation\nsing as a programming technique.\nToo frequently, computer science literature reports the\ncapabilities of a system without reporting the implementa-\ntion techniques, even though the latter are more likely to\nWILFRED J. HANSEN*\napply to the design of other systems. This situation has\nStanford University, t Stanford, California\nbeen improved for plex processing by D. Knuth; [3]\nprovides excellent descriptions of numerous plex processing\ntechniques. Good reviews of the literature and further\nCompact lists are stored sequentially in memory, rather than\nreferences are in [10], [1], and [4]. Interesting projects are\nchained with pointers. Since this is not always convenient, the\nreported in [8] and [11], the latter being part of SDC's\nSwym system permits a list to be chained, compact, or any\nTM-3417 series describing the Lisp 2 implementation for\ncombination of the two. A description is given of that list\nthe I B M 360. The full Swym report [2] details the storage\nrepresentation and the operators implemented (most are\nmanagement alternatives for implementing the plex\nsimilar to those of LISP 1.5). The system garbage collector\nprocessing facilities of a higher-level language.\nattempts to make oil lists compact; it relocates and rearranges\nWhile investigating graphic applications of plex proces-\nall of list storage using temporary storage. This unique list-\nsing, the Stanford Graphics Project developed a list\ncompacting garbage collection algorithm is presented in de-\nrepresentation--called compact lists--that can reduce\ntail. Several classes of the macros used to implement the sys-\nstorage requirements by up to half. To experiment with this\ntem are described. Finally, consideration is given to those\nnew representation, the Swym plex processing system was\ndesign factors essential to the success of a plex processing\nimplemented. A report is given here on the techniques of\nsystem implementation.\nthat implementation and some experimental results. The\nKEY WORDS AND PHRASES: data structure, data representation, list struc-\nfocus is on the Swym garbage collector because it is a\nture, llst representation, list, compact llst, garbage collection, relocation,\nvital part of the system and employs a unique algorithm.\nstorage reclamation, macro, primitive list operations, plex processing,\nThe difference between conventional list representations\nplex, pointer, llst processing system, LISP, free storage\nand compact lists parallels the difference between the\nCR CATEGORIES: 3.49, 4.20, 4..22, 4.49, 4.9\nI B M 650 and most other computers. 650 instructions had\ntwo address fields: one for the operand and one for the next\ninstruction. Most other computers save memory by as-\nI n t r o d u c t i o n\nsuming that the instructions are sequential. When the\nA plex1is a collection of data items stored in one or more\ninstruction sequence is broken, a \"branch\" instruction\nlocations of memory. Manipulation of such collections as\ncontinues execution elsewhere. Like the 650, many list\nentities is called plex processing and is characterized by\nrepresentations use two pointers for each element of a\nthe following: (1) a data item may be a pointer (the address\nlist: one to the element and one to the rest of the list. On\nof a plex), and (2) plexes are created and discarded during\nthe other hand, list storage can be conserved by storing\nexecution. Plex processing can simplify programming and\nlists sequentially in memory; then only the pointers at the\nelements are required. But if that is the only way lists can\nThe work reported here was supported in part by the National\nbe stored, certain list operations will be time-consuming.\nScience Foundation, Grant GP-7615.\nThe Swym solution is to allow a \"list branch\" pointer.\n* Present address: Applied Mathematics Division, Argonne Na-\nLists are normally sequential, but when a list cannot be\ntional Laboratory, Argonne, Illinois.\nt Department of Computer Science, Stanford Graphic Project.\nsequential, it is continued with a \"list branch\" pointer.\n1This term was coined by D. T. Ross [9], who used it to represent\nFigure 1 illustrates several list structures in both the old\na collection of \"n-component elements\" connected by pointers.\nand new representations. Note that a \"list branch\"\nCommon usage (and this paper) calls an n-component element a\npointer is called a r s t pointer because it points to the rest\nplex and a collection of these a plex structure. A list is one form\nof plex structure.\nof the list. In Section 1 a description is given of the details\n\nVolume 12 / Number 9 / September, 1969 C o m m u n i c a t i o n s of t h e ACM 499\n\n-------- Page Break --------\n\nUsual Representation Compact Representation\ninternal structure. Note that lists are specially distin-\n. . r ; - l ~ - q -\"r~-T~-~3 I A i B I®~1\nguished plex structures because the garbage collector can\ncompact them.\nSwym list words have the format shown in Figure 2a.\nIf the r s t bit is zero, the word points at an element of the\nlist. If the r s t bit is one, this pointer is a so-called \"list\nbranch\" pointer; it points not at an element of the list but\nat the continuation of the list. The atom bit is one in a\npointer at an atom. This is the distinguishing characteristic\nof an atom in the Swym system. If both the atom and r s t\nAll Possible Mixed RepreseIltations of C:\nbits are zero, the pointer points at a sublist of the given\n=,, B I c I / \" I I A I B I ® ~ I ~ ' L C - ~\nlist. If both the atom and r s t bits are one, the end of the\nI . A pointer at an atom is represented by a character string. (Tile 'prink nanle i of the atom.)\nlist has been reached. A list ending with a pointer at the\n2. A qist branch' pointer is indicated by (~) (fOr rst).\natom NIL is a normal list; otherwise, it is what in LIsP\n5. ~ - ~ is written ~ to indicate the end of a normal list.\n1.5 is sometimes called a general s-expression. The atom\n4, Any otber rs._~pointer at an atom is the end of a 'general s-expression' list.\nNIL is treated as a list with no elements.\nF I G . 1. Comparison of usual and compact list representations\nAssociated with each atom is an atomhead--a word\ncontaining the type of the atom and two marking bits for\nthe garbage collector. Two atom types have been imple-\nof the compact list representation. In Section 2 the basic\nmented: LisP 1.5 atoms (called symbols) and bit-string\noperations on such lists are defined.\natoms. There are three subtypes of the latter: character\nWhen storage is exhausted in a plex processing system,\nstrings, numbers, and hexadecimal numbers. Other atom\na garbage collector is called to find all active storage and\ntypes may be defined simply by coding the primitives to\nmake all inactive storage awilable for use. The Swym\ncreate, manipulate, and garbage collect each new atom\ngarbage collector converts ordinary lists to compact lists\ntype. The format of an atomhead is shown in Figure 2b.\nwhenever it can. In this process, all active storage is\nThe twenty-two unused bits may be used for different\nrearranged and relocated at the low end of the plex free\nstorage area. Two versions of the central garbage collection\nroutine are presented in Sections 3 and 4. The first illus-\na. List Word\ntrates the basic principles; the second includes all details.\nV [ Address f,e,~ I I I\nAn earlier system permitting compact lists intermixed\n0 1 29 30 51\nwith chained fists has been reported by N. Wiseman [12].\nReserved for Atom bit\nThis system provides for the creation of compact lists, but\nGarbage Collector (M1) I\nI\nthe garbage collector does not rearrange storage t o remove\nrs.~. bit\nalso used by\nr s t pointers. Unlike Swym, variables may point at rst\nGarbage Collector (M2)\npointers and there may be more than one r s t pointer\nb. Atom Head\nbetween element pointers. But the user must program\nextra checking to avoid treating rst pointers as list\nI I [ ~ypo I ll [ f\npointers. Wiseman presents no data on the effectiveness of\nalw ys 1 in an\nhis system.\natom head\nFinally, in Sections 5 and 6 an outline is given of the\nType of atom\nRes ved for Reserved for\nGarbage Collector (M1) Garbage Collector (M2)\nmajor techniques used in implementing Swym. Macro\ninstructions made the system easier to write, easier to\nFIG. 2. Formats of Swym internal eneodings\nmodify, and easier to read than if it were written entirely\nin assembly language. Several classes of the Swym imple-\npurposes for different atom types. For bit-string atoms,\nmentation macros are described in Section 5. In Section 6\nthey contain the subtype and the length of the string. For\nthere is a discussion of the major principles which must be\nsymbols, they contain information about the content of\nconsidered in the design of a plex processing system\nthe property list.\nimplementation.\nBecause free storage is one contiguous block, new plex\n1. S w y m S t r u c t u r e s\nstructure is created from one end of that block. This\nstorage allocation scheme has proved advantageous in the\nTo illustrate Swym capabilities, an interpreter was\nCogent system [9]. Lists can be created in compact form\nimplemented for a subset of LisP 1.5 [5]. Very complex\nif all their elements are known. Atoms of any size can easily\nplexes can be realized under Swym, but in this section we\nbe created; for example, bit-string atoms are always stored\nconsider only those required for the interpreter: lists and\nin consecutive bytes. Note that the garbage collector re-\natoms. A list is a sequence of pointers. Each pointer is the\nquires only two bits in the atomhead; all other words in an\naddress of an element of the list. An element, in turn, can\natom structure may be full words.\nbe either a list or an atom. An atom is a plex with arbitrary\n\n500 C o m m u n i c a t i o n s of t h e ACM Volume 12 / N u m b e r 9 / September, 1969\n\n-------- Page Break --------\n\nMost of these operators are implemented in a straight-\nSwym was originally designed for a 360/67 with 32-bit\nforward manner. The operators fst, r p l f , a t o m , and n u l l\naddresses; but three nonaddress bits are available in every\nrequire 1, 1, 3, and 2 instructions, respectively, c o n s is\npointer. T h e low-order two bits are available because they\nalways a subroutine call because it is lengthy and infre-\nare always zero in a pointer at a full word. The high-order\nquently used by the system. A special subroutine linkage\nbit is available because negative addresses are impractical\nrequiring five instruction-executions calls c o n s . The rou-\n- - t h e y are algebraically smaller, though topologically\ntine itself requires six instruction-executions unless the\nlarger, than positive addresses. This discontinuity requires\ngarbage collector is called.\nextra code in all address computations if the program might\nUnlike any other routine, r s t invokes out-of-line code\nbe loaded across the address boundary.\nwith a simple BAL (Branch And Link). This code is in a\nA pointer at an atom points six bytes in front of the\nsection of the system t h a t is always addressable. A call on\natomhead. This assures that the atom bit is one in a\nr s t is:\npointer at an atom. At the same time, operators on atoms\nBAL L, R S T\ncan address the atom directly without masking the atom\nAt this point, the pointer whose r s t is to be taken must be\nbit. F r o m a paged-memory standpoint, the atom bit has a\nin register X. At location RST, the code is:\nsmall advantage: whether or not an element is an atom can\nbe decided without accessing t h a t element. A major\nR S T T M 7 ( X ) , X ' 0 1 ' test\nr s t bit\nadvantage of the atom bit is that\nf s t a n d r s t both cause an\nBO RST1 branch if one\ninterrupt if their argument is an atom. The advantages of\nB X H X , C 4 , 0 ( L ) iner X by 4 and return\nthe atom bit suggest its use even in a 24-bit address\nRST1 L X , 4 ( X ) pick up r s t pointer\nB C T R X , L turn off r s t bit and return\nmachine.\nRegister L is a standard linkage register. Register C4 is an\n2. B a s i c O p e r a t o r s\nodd register containing 4. The result of r s t is left in\nregister X. Either the B X H has added 4, so that X points\nThe basic Swym operators are direct counterparts of the\nat the next location of memory, or the L has loaded the\nbasic Lisp operators, though the mnemonics were changed\nnext location of memory. Note t h a t in the latter case the\nas an advance beyond the IBNI 704. Each operator exists\nB C T R turns off the r s t bit. If X points to an atom, r s t\nin two forms: first, as a routine which can be called from\nwill cause a program interrupt: the L is attempted because\nan interpreted function; second, as a macro which can be\nthe T M detects the \"1\" in the middle of the atomhead.\ncoded in assembly language or compiled b y a compiler.\nThis is why an atom pointer points six, not two, bytes in\nThis second form is the main consideration below; only\nfront of the atomhead. To avoid register transfers, there\noperators required to describe the garbage collector are\nis a different r s t routine for each pointer register.\npresented. A simple interpreter has been implemented,\nI t is a shortcoming of compact lists that the operation\nproviding the capabilities of basic LmP (without PROG).\nr p l r is not allowed (this would correspond to the Lisp\nf s t (/)--returns the first element of the list g (corresponds\noperation R P L A C D ) . This is because there is not always\nto Lisp 1.5 CAR). Processing is interrupted if g is an\na r s t field to be replaced. As a result, lists cannot be sorted\natom.\nb y changing the links between the elements. One possibility\nr s t (l)--returns the rest of the list l beyond the first\nis to chain lists in the f s t direction and use r p l f to change\nelement (corresponds to Lisp 1.5 CDR). The program\nthe order of the list. B u t this makes for unnatural list\nis interrupted if l is an atom.\nstructures and nonintuitive coding. A possible solution is\nc o n s (e / ) - - c o n s t r u c t s a new list by adding the element\nthe introductior~ of the atom type true-list, a list with\ne in front of the list 1. Returns a pointer to a new list\nexplicit r s t pointers. Whenever a true-list is created, it is\nll such that f s t (11) is e and r s t ill) is 1. If free storage\nplaced on a special list of all such atoms. The first task of\nis exhausted, c o n s calls the garbage collector. ( c o n s\nthe garbage collector is to mark all elements of all true-\ntakes two words from free storage: a pointer at e and a\nlists so they will not be collected by other routines. The\nr s t pointer at l.)\nmarking bit m l can be used for this function because\nr p l f (1, e)--replaces the first element of 1 with e (corre-\nC O L L E C T ignores any structure marked with that bit.\nsponds to Lisp 1.5 RPLACA). This is accomplished by\nAnother possible solution to the problem posed by r p l r is\nchanging the list l (by storing a pointer to e in place of\nto extend the notion of the r s t pointer. E v e r y time a\nthe pointer to fst(l)). The result returned b y r p l f is l,\npointer is used it is checked to see if it points at a\nr s t\nbut fst(1) is different, rst(/) is unchanged.\npointer. If so, the r s t pointer replaces the pointer in\na t o m @)--This predicate tests whether x is an a t o m . To\nquestion. B u t this solution greatly increases all list access\nthe interpreter, the result is either the atom T or the\ntime.\natom NIL, for true or false, respectively. For the result\nOn the surface, it might appear that arrays are possible\nof a predicate macro, see Section 5.\nas a direct extension of Swym compact lists. A list guaran-\nn u l l (x)--This predicate tests whether its argument is the\nteed to be compact could be referenced b y direct-address\natom NIL, returns results in' the same manner as does\narithmetic. Unfortunately, problems arise: if any substruc-\na t o m .\nr s t of that list, that\nture of the list includes a pointer to a\n\nVolume 12 / Number 9 / September, 1969 C o m m u n i c a t i o n s o f the ACM 501\n\n-------- Page Break --------\n\nrst will be collected before the preceding portion of the list.\nmeats of t h a t list. When a list is written to new core, the\nAs with true-lists, a possible solution is the creation of a contents of t h a t list must be the new core addresses of the\nspecial type of atom called the list-array, a list with no rst\nelements of t h a t list. Consequently, the elements of a list\npointers. When a list-array is created, it is put on a special\nmust be C O L L E C T e d before the list itself can be written\nlist. The first task of the garbage collector is then to mark\nto the new core. C O L L E C T (x) proceeds in two recursively\nall list-arrays so they will be collected linearly. Again, the\nintertwined passes. T h e first pass applies C O L L E C T to\nm l bit could be used.\neach element of the list x. The second pass writes the new\nrepresentation of the list x to the new core image. To\n3. Basic Garbage Collector A l g o r i t h m\nremember where a piece of list structure is in new core, its\nThe Swym garbage collector creates a set of structures\nf s t is replaced (rplf) with the address of t h a t structure in\nisomorphic to all active structures with respect to r s t and\nnew core. The head of an atom is used to store the address\nfst. Most rst pointers are eliminated. This set of structures of that atom in new core.\nis in a new core image, created sequentially and written to a\nThree operators must be defined in order to describe the\ntemporary storage device. After collecting all active struc- garbage collector:\ntures, the new core image is read into one end of the plex\nA T C O L\n(x)--x must be an atom. If x has not been garbage\nstorage area. The remainder of t h a t area becomes the free\ncollected, it is collected and written to the new core\nstorage area so t h a t plexes of arbitrary size m a y be allot\nimage. The atomhead of x is replaced with the address\ncated as required.\nof x in the new core. A T C O L calls separate routines to\nAn M I T memorandum by h~insky [6] influenced the\ngarbage collect each type of atom.\ndesign of the Swym garbage collector. H e suggested both\nG C P U T (x)--x is any full word. This word is written to the\nthe use of temporary storage and the possibility of rear-\nnext available location in the new core image. The value\nranging lists so t h a t the rst points to the next location of\nof G C P U T is the address of t h a t location. An internal\nmemory. Without suggesting compact lists, he remarks,\nvariable is advanced to point at the next available loca-\n\" T h e r e are probably some important applications of (such\ntion in the new core image. G C P U T handles I / O and\nrearranged lists).\" But Minsky's algorithm does not work\nwrites buffers to the external device when necessary.\nfor even the simplest cases (for example, the structure of\nH D\n(x)--x must be an atom. H D returns its atomhead;\nFigure 4). The Swym garbage collector works for not only\nafter ATCOL, the atomhead contains a pointer to x in\nthe simplest cases but also the most complex cases of\nthe new core. If x is nonatomic, processing is interrupted.\nmutual circularity. The complete garbage collector is\nT h e basic garbage collection algorithm is given in Figure\ndescribed in Section 4; in the present section we give a\n3 in a notation derived from ALGOLand Lisv M-expressions.\nminimal version of the garbage collector to illustrate the\nThe declarator list declares a variable which m a y point\ncentral ideas. This minimal version is satisfactory only for\nat a piece of list structure. The declarator w o r d declares a\nstructures t h a t never have more t h a n one pointer at any\nvariable whose value is one full word. Note t h a t r s t b i t is\ngiven word of the structure.\ninitialized to the value 1. This corresponds to the value of\nC O L L E C T (x), the portion of the garbage collector\na word with just the rst bit on. r s t b i t is used to\n\"or\" the\npresented both here and in Section 4, has as its argument\nrst bit into a word written to the new core image. The\na pointer at a piece of list structure. I t then writes t h a t list\nresult of applying C O L L E C T to a simple structure is\nstructure sequentially to the new core image. Other func-\nshown in Figure 4.\ntions must be written to call C O L L E C T for each possible\n\"Garbage collection\" is truly a misnomer for this\npointer at active structure, to collect atoms, and to read\nalgorithm. C O L L E C T examines only the active list struc-\nin the new core image.\ntures, while the garbage is completely ignored and has no\nThe contents of a list are address pointers to the ele-\neffect on the processing. \"Storage reclamation\" describes\nthe process no better. Possibly better terms might be\nC O L L E C T (x) = b e g i n l i s t r, t; w o r d rstbit : = xl00000001t;\n\"storage reorganization\" or \"garbage control.\" B u t the\nc h k l o o p : t : = f s t ( r ) ;\nterm \"garbage collection\" is so widely used and so colorful\ni f a t o m ( t ) t h e n A T C O L (t) e l s e C O L L E C T (t);\nas to preclude replacement.\nt : = r s t ( r ) ;\ni f a t o m ( t ) t h e n A T C O L (t)\n4. T h e C o m p l e t e Garbage Collector A l g o r i t h m\ne l s e b e g i n r : = t; g o t o c h k l o o p e n d ;\nT h e simple garbage collector above is inadequate for\nw r l o o p : t : = f s t ( r ) ;\nmany common list structures: circular lists, several lists\nt h e n G C P U T ( H D (t))\nr p l f (r, i f a t o m (t)\nwith the same rst, a structure which is an element of more\ne l s e G C P U T ( f s t ( t ) ) ) ;\nt h a n one list, and more pathological cases. T h e imple-\nt :---- r s t (r);\nmented garbage collector handles all possible cases with\ni f a t o m (t) t h e n G C P U T ( H D ( t ) V rstbit)\ne l s e b e g i n r : = t; g o t o w r l o o p e n d\nmarking bits and a fixup table.\ne n d\nC O L L E C T\nTwo marking bits are associated with each list word.\nEach pass sets a marking bit to indicate it has visited a\nFIG. 3. S i m p l i f i e d C O L L E C T a l g o r i t h m\n\n502 C o m m u n i c a t i o n s o f t h e ACC~VI                     V o l u m e 12 / N u m b e r 9 / S e p t e m b e r , 1969\n\n-------- Page Break --------\n\nInitial Structure:\ngiven word. The first pass sets bit m l , the second sets m2.\nSpecial action must be taken when a marked word is en-\nencountered, because t h a t word is already being processed\nat some other level of recursion. A word with m 2 set always\ncontains the address of the corresponding word in the new\ncore image.\nSeveral functions set and test the marking bits:\nMARK1 (w) The word pointed at by w is marked\nwith m l .\nAt wrloop on the highest revel:\nMARK12 (w) The word pointed at by w is marked\nwith both m l and m2.\nOld Memory\nU N M A R K 1 (w) m l is turned off in the word pointed\nat by w.\nM1 (w) This predicate is t r u e if m l is on in\nthe word pointed at by w.\nM2 (w) This predicate is t r u e if m 2 is o n in\nthe word pointed at by w.\ni /\nConceptually, each of these functions tests its argument to\n- ¢ I\n• J\nsee if it points at an atom, and adjusts the addressing\nNew Memory ~ I Ii\nappropriately. In practice, it is known a priori whether\n~ t ,\nthe argument is an atom, and a bit macro (see Section 5)\nis coded instead of a function call.\nIn circular structures, a word points at some structure\nalready being collected at some higher level of recursion\n( m l is set, but not m2). T h a t word cannot be written\nAt completion:\ncorrectly to the new core image because its contents are\nOld Memory\nnot determined. In most reasonable applications, the\nnumber of such circularities is well below one percent of\nthe number of pointers. Nonetheless, some provision must\nbe made to handle this case; in Swym, the garbage collector\nuses a ffixup table. When the correct new contents cannot\n! I | /\nI / ~ - - - q r - - J )\nbe determined, a word of zeros is written to the new core\nI f 1 - ~ [ - Fk - . . . . . . . . . . . . .\nand an entry is made in the fixup table. Each entry is two\na I I I\npointers. The first points at the word of zeros in the new\n\\ ] I I I i\ncore; the second points at the word in old core which will\nNew I j I 1 I • It\nMe-~ory I I I I f ! I\neventually contain the correct address to substitute for\nthe word of zeros. After C O L L E C T is fiifished, the second\n] .... la.-d ' TI .... ~ ] , . , w l , ° . ~ f IDn.] ! [~]\npointer of each fixup entry is replaced by the contents of\nh J < \\~ Y ..I/\nthe word it points at. Then, after the new core image has\nbeen read in, the fixups are applied; i.e. the second word of\nN o r e : , new pointer\nthe entry is \"or\"ed into the location indicated by the first\n- - pointer unchanged from preceding diagram\nword of the entry. (The \"or\"ing permits the word of\n. . . .. . . . }pointerbeenreadat in.l°cati°n a word will occupy after the new core image has\nzeros to have the r s t bit on if required. The fixup procedure\nthus works for both f s t and r s t fixups.)\nFxe. 4. Effect of COLLECTing a simple structure, assuming a l l\natoms have already been collected. At completion, the new core\nOne new function must be defined to describe the com-\naddress of the corresponding structure is in fst(x).\nplete garbage collector:\nF I X U P (p,c)--the word c (either zero or r s t b i t ) is\nThe complete garbage collector is given in Figure 5. The\nG C P U T to the new core. An entry is made in the fixup\nargument x must be a pointer at a list structure with\ntable consisting of the address returned by G C P U T and\nneither marking bit on. C O L L E C T has no value, but the\nthe pointer p.\nnew core address of the list corresponding to x is stored in\nThe function A T C O L defined in Section 3 must be ex-\nplace of the pointer to fst(x). A demonstration t h a t this\ntended. When A T C O L is entered, the m l is set in the\nalgorithm creates a correct representation of its argu-\natomhead. After collecting the atom, both marking bits\nment is given in [2]. The U N N I A R K i ( r ) and the Boolean\nare set. Since C O L L E C T may be called for some substruc-\nvariable m are related. The former indicates the need for a\nture of an atom, provision is made for a pointer at an atom\nfixup in the r s t direction; the latter detects this need in\nwith m l and not m 2 (a fixup entry is generated).\nthe second pass. In Figure 5, the marking bits are assumed\n\nV o l u m e 12 / Number 9 / September, 1969 Communications of the ACM 503\n\n-------- Page Break --------\n\ndividing execution time into amount of active storage. The\nto be associated with each word. and not part of the word.\nexperimental system did not use external storage; instead,\nThis association could be by extra bits in the hardware or\nmemory was shuttled between two alternate core areas.\nby a bit table in a separate area of memory. The former\nThus the time to write out memory is the maximum of the\nrequires hardware modification, while the latter requires\ntime to write out the active structure and the time to\nsix percent more memory. In the implemented system,\nexecute 40 instructions for each active word. The time to\nthe marking bits are in the list words themselves, as shown\nread in memory is dependent solely on the number of\nin Figure 2. Figure 5 must be modified for these bit assign-\nactive words.\nmeats by turning off the marking bits in the arguments to\nSeveral applications for the Swym garbage collector are\nGCPUT and replacing\nconceivable, even apart from compact list structure. The\nt : = r s t (r)\n\nInitial Structure:\nwith\ni f Ml(r-t--4) t h e n t : = r -4- 4 e l s e t : = r s t ( r )\nX : -\nDiagrams of the effect of COLLECT on a complex struc-\nture are shown in Figure 6.\nSome limited experiments have been conducted with the\nSwym garbage collector. On one list structure, representing\na program, there was a 25 percent saving of storage using\nAt ~rloop on the highest level:\ncompact lists instead of standard lists. This corresponds to\nOld Memory\nan average list length of only two elements. The corre-\nspondence is easy to compute. A normal list of length n\nrequires 2n pointers. The corresponding compact list re-\nquires n + 1 pointers, for a saving of 1 --((n + 1)/2n);\nwhen n is 10, the saving is 45 percent. Every symbol\nFixup Table\natom takes at least four words of storage plus the length\nof the print name; so the number of symbol atoms is also a\nfactor.\nFor every active word of storage, 40 instructions were\nexecuted during garbage collection. This was computed by\nI\n\nNew Memor~\nC O L L E C T (x) = b e g i n l i s t r, t; B o o l e a n m;\nrstbit : = x'00000001';\nw o r d\nr : - ~ X;\nAt exit from COLLECT:\nchkloop: c o m m e n t Loop to collect each f s t ;\n: = f s t ( r ) ; M A R K I ( r ) ;\nt\nOld Memory\ni f\na t o m ( t ) t h e n A T C O L ( 0 e l s e i f m 1Vfl(t) t h e n C O L L E C T\n(t);\nc o m m e n t T e s t for e n d of list or r e a c h e d m a r k e d word;\n: = r s t ( r ) ;\nt\nt . _ _ \" . . . . . . ,\na t o m ( i ) t h e n A T C O L (t)\ni f\nFixopTahle ' - - \" i i\ne l s e i f 1V~2(t) t h e n\n' '\ni f Ml(t) t h e n U N M A R K 1 (r)\ne l s e\nI I\ne n d ;\ne l s e b e g i n r := t; g o t o ehklo0p\nI\nr : = X;                                                  , , , , , ; ',\nwrloop: c o m m e n t Loop to write o u t each new f s t ;                                       !\nI\n: = f s t ( r ) ;\nm := M l ( r ) ; t\na t o m ( t ) t h e n\nr p l f (r, i f\nI / i i\nNew Memory\ni f M2 (~) t h e n G C P U T (HD(0) e l s e F I X U P\nT * v ~ #\n(t, 0)\ne l s e i f M2 (1) t h e n G C P U T (fst(l)) e l s e F I X U P\n(t, 0));\nMARK12(r) ;\nFinal structure after reading new core image and applying fixups:\nc o m m e n t T e s t for e n d of second pass;\nt : = r s t ( r ) ;\nstructure:\ni f a t o m ( t ) t h e n\ni f M2(t) t h e n G C P U T (HD(t) v rstbit)\ne l s e F I X U P (t, rstbit)\ne l s e i f M2(t) t h e n G C P U T (fst(t) v rstbit)\ne l s e i f m t h e n b e g i n r : = ~; g o t o wrloop e n d\nFza. 6. Effect of C O L L E C T i n g a complex s t r u c t u r e . M a r k i n g\nF I X U P ( t , rstbit)\ne l s e\nb i t s are i n d i c a t e d b y integers in t h e lower corners. T h e usuM list\ne n d C O L L E C T\nr e p r e s e n t a t i o n of t h e initial s t r u c t u r e would include a r s t p o i n t e r\na f t e r t h e p o i n t e r to A.\nFIG. 5. Complete C O L L E C T a l g o r i t h m\n\n5 0 4 C o m m u n i c a t i o n s o f t h e A C M V o l u m e 12 / N u m b e r 9 / S e p t e m b e r , 1969\n\n-------- Page Break --------\n\nSwym garbage collector could be valuable in a system with\ncode instructions in terms of t h a t specification. Tile Swym\nroll out and roll in. If the monitor set a signal for the pro-\nbit macros provide this facility--the macro B I T declares a\ngram to roll itself out, the program could garbage collect\nmnemonic to represent a bit in a field. The macros SET-\nfor free the next time a c o n s was executed. The garbage\nB I T , R E S E T B I T , I N V R T B I T , and T E S T B I T accept as\ncollector would be valuable in a paging environment be-\narguments the name of a register pointing at a field in\ncause it tends to localize list structure. External storage of\nmemory and the name of a bit. The first three affect the\nstructures has always been a problem for plex processing\nstate of the bit; T E S T B I T is a predicate m a c r o - - i t tests\nsystems. The Swym garbage collector provides an algo-\nthe bit's state.\nrithm for scanning lists and storing them in a compact form\nThe byte-immediate instructions are used to implement\non an external device. Another application for this algo-\nthese macros. One instruction is assembled for each macro\n(two for T E S T B I T ) . The B I T definition is preserved in\nrithm is in the transmission of list structures between two\nmachines over a slow channel. If the new storage is written\na pair of assembly-time global arrays.\nstarting at location zero, the address fields can be small.\nT h e garbage collection algorithm frequently makes a\nOnly as the size of the structure passes a power of two\ntest and then executes one of two alternate pieces of code.\nwould the length of each address field have to increase.\nIn higher-level languages, such constructions are usually\nThe implemented garbage collector stores partially col-\nexpressed as conditional statements in the form:\nlected structures on the stack but uses a trick to avoid    i f (predicate) t h e n (true part) else (false part)\nThe advantage of this kind of language facility is that it\nsaving return addresses during recursion. I t would be\nmakes clear that one of two alternate paths will be exe-\npossible to use the WisP technique [10] to avoid using the\ncuted. In conjunction with proper indentation, this facility\nstack during collection. This was not done because it would\ncontributes greatly to the reader's comprehension of the\ninvolve at least two more passes over the data. In a\nprogram. To provide this convenient high-level language\nmemory-sharing environment, it is sometimes possible to\nstructure in assembly language, a set of macros was imple-\nacquire temporarily the needed extra storage for a stack;\nmented for Swym.\notherwise, sufficient stack must be available to hold twice\nFour macros are basic to the conditional execution\nthe length of the longest f s t chain.\nfacility: IF, T H E N , E L S E , and E N D I F . None has any\n5. M a c r o s for I m p l e m e n t i n g S w y m\nparameters. T h e y are used in an assembly language just as\nare their counterparts in a higher-level language program:\nMacros are a powerful programming tool for more\nimportant reasons than just the reduction of the amount\nIF\ncode for (predicate)\nof writing required. Operations can be stated in terms of\nTHEN\nthe problem at hand rather than the machine at hand. Even\ncode for (true part)\nthough the macro form of many of the operators in Section\nELSE\ncode for (false part)\n2 assembles only one instruction, it is important to use the\nENDIF\nmacro because the intent of the operation is clarified and\nthe data type of the operand is emphasized. Clarity is\nThe code for the true and false parts m a y be any code\nimportant both to the interested reader and the per-\nincluding other if-then-else sets. B u t the predicate m a y not\nplexed debugger. Consistent and extensive use of macros\ncontain IF. I t is possible to omit the E L S E and the false\nalso facilitates program modification. In m a n y cases, an\npart; the correct code will still be generated.\nentire data representation can be modified b y changing a\nThe four conditional macros generate appropriate labels\nfew macros.\nand branch instructions (given the assembler, there is no\nSeveral classes of macros were created to facilitate the\ngood way to avoid labels altogether). The labels are gener-\nimplementation of Swym. One class has already been\nated b y the I F macro and saved on a global assembly time\ndescribed--the macros implementing the primitive func-\nstack. The use of the stack permits nesting of IF's up to\ntions. Another class of macros manipulates data on the\n63 levels.\npushdown list: PUSH, POP, TOP, R P L T O P , etc. To\nMore high-level-language-like features are available\navoid excessive subroutine calls, G C P U T and F I X U P\nwithin the predicate part. The conditions most likely to be\nwere also implemented as macros. T h e bit macros and the\ntested for are ATOM, NULL, and T E S T B I T . Each of\nconditional execution macros deserve detailed discussion.\nthese is implemented as a predicate macro. This assembles\nThese macros show the power of the 360 assembler,\na test and a conditional branch to one of the labels on top\nespecially the global array facility. The creation of the\nof the I F stack. These macros can also be used without I F\ninitial contents of the plex storage area also demonstrated\nb y supplying a destination label as an argument. The\nthe power of the 360 macros. This process involved hash\nconditional branching macro P R E D B R can be used in\ncoding identifiers (at assembly time) to assemble list\ncase the provided predicates are inadequate. Before calling\nstructure putting those identifiers in the proper bucket of\nthis macro, the condition code must be set for the condi-\nthe OBLIST, the list of all atoms.\ntion to be tested. P R E D B R ' s arguments are two op\nIn the 360 assembler language, a mnemonic m a y easily\ncodes, one to make the test for true, the other to make the\nrepresent a specific bit within a byte. B u t there is no\ntest for false (e.g. B H and B N H ) . P R E D B R chooses the\nconvenient way to specify a bit within a field and to then\n\nCommunications of the ACM 505\nVolume 12 / Number 9 / Sel~tember, 1969\n\n-------- Page Break --------\n\nfrom the routine. Furthermore, these instructions must be\ntest for false unless the NOT macro has occurred. The\nsatisfactory for recursive routines; that is, return addresses\nbranch address is taken from the global IF label array and\nmust be saved on a stack. The Swym system has three\none instruction is assembled. All predicate macros use\nroutine linkage macros: one each for entry, exit, and call.\nP R E D B R to do their branching. Elementary predicate\nEach assembles three instructions. Altogether, execution\nmacros may be combined by the use of the Boolean con-\nof the nine instructions requires accessing only 11~ words\nnective macros AND, OR, and NOT. These macros have\nof memory. This is probably the minimum required to per-\nno parameters. There are no parentheses macros, and\nform these necessary functions: maintain addressability\nAND has higher precedence than OR.\nfor the calling and called routines, stack and unstack the\nThe macros described in this section simplified construc-\nreturn address, and mark the return address to distinguish\ntion of the garbage collector and made the result easier to\nit from a pointer.\nread. The code is written beginning in columns 40, 45, 50,\nThe Swym system supports several different variable-\n55, depending on the level of nesting of IF's. This separates\nbinding methods, but most are beyond the scope of this\nthe source program from the generated code. Few com-\npaper. The system itself binds variables to general registers,\nments are required because the macros are highly mne-\nlocations on the stack, and a special section of memory for\nmonic and specific to the data structure.\na few global values. General registers to be saved must be\n6. F a c t o r s i n t h e D e s i g n of a S y s t e m\nsaved and restored by the calling routine. With this con-\nI m p l e m e n t a t i o n\nvention, very few registers need be saved because only\nthose registers with active information are saved. More-\nWhile implementing Swym, several factors important\nover, a register can be saved and more than one function\nto the design of any system implementation were isolated.\ncalled before that register is restored.\nThe more important of these factors can be summed up in\nBecause all active storage must be COLLECTed, all\ntwo rules:\npointers must be recognizable as pointers. This is a string-\n1. Optimize linkages.\nent restriction on system design. Some means must be\n2. Identify pointers.\nprovided to determine for each word in the stack or in a\nOptimization effort should be spent on the most frequent\nplex whether or not it is a pointer. A word can be known\noperations. In plex processing languages, the most frequent\nto be a pointer either by testing special bits or by the con-\noperations are not the callable operations (fst, rst, c o n s ,\ntext in which the word is accessed. In Swym, all list words\netc.), but the linkage operations: data access, routine\nare pointers because fists can contain only pointers. I t is\nlinkage, and variable binding. These operations are so\nsimple to define atom types having pointers known to be\nprevalent that serious consideration must be given to\npointers because of their position in the plex for that atom\ndesigning them into the hardware. Each of these is dis-\ntype. Bits are used to distinguish pointers on the Swym\ncussed below. The second rule is a result of the fact that\nstack. A low-order bit of one indicates that that word is\nthe garbage collector must be able to find all active struc-\nnot a pointer. Return addresses are marked this way; they\ntures. The implications of this rule are also discussed below.\npoint one byte in front of the return location. Blocks of\nSome data representations require address decoding to\nwords may be allocated on the stack. Bits in the stack-\naccess a data element; some even require table look-up.\nblock head indicate which words in the block are pointers.\nSince any operation on data requires accessing that data,\nsuch time-consuming access methods mean that programs\nC o n c l u s i o n\ncannot run rapidly. This usually means that the program\ncannot be used to attack any problems big enough to\nIn this paper we have discussed a new list representa-\njustify the use of a computer. In plex processing, a better\ntion, a garbage collector especially suited to that repre-\nphrase than \"data access\" is \"descend one level in the data\nsentation, and some of the considerations involved in\nstructure.\" The Swym operators\nr s t and fst descend one\ndesigning a system implementation. The data representa-\nlevel in the data structure and are reasonably efficient\ntion has some advantages in saving space. The garbage\n(rst involves at most five instruction-executions). Swym\ncollector has the same advantage, as well as the advantage\nalso provides for storing data in atoms; the components of\nof putting associated information close together. These\nan atom can be accessed directly if the address of the atom\nadvantages must be weighed carefully against the slight\nis known.\namount of additional processing entailed. The most\nPlex processing programs tend to execute a large number\nadvantageous use of these structures is in situations where\nof subroutine calls; so the routine linkage mechanism must\ninformation must be transferred; many instructions can\nbe efficient. While it is a waste of both time and memory\nbe executed in the time needed to do one word of input/\nto save and restore 16 general registers every time a sub-\noutput. Swym demonstrates that careful attention to the\nroutine is called, it is sheer nonsense to call a special\noverall design of a system implementation can contribute\nlinkage subroutine every time a subroutine is called. If\nto its success.\nany function of a machine is considered when that machine\nAcknowledgment. The author is grateful for the advice\nis designed, that function ought to be routine linkage. No\nand encouragement of Professor William F. Miller.\nmore than two instructions should be executed to call a\nsubroutine: one to call the routine, and a second to exit\nRECEIVED NOVEMBER, 1968; REVISED JANUARY, 1969\n\n506 Communications of t h e ACM Volume 12 / Number 9 / September, 1969\n\n-------- Page Break --------\n\nREFERENCES\n7. Ross, D . T . A generalized technique for symbol manipula-\nand numerical calculation. Comm. ACM 5, 3 (Mar.\ntion\na i d e d\n1. GRAY, J. C. Compound data structure for computer\n1961), 147-150.\ndesign; a survey. Proc. ACM 22nd. Nat. Conf. 1967, Thomp-\n8. . The AED free storage package. Comm. ACM I0, 8\nson Book Co., Washington, D. C., pp. 355--365.\n(Aug. 1967), 481--492.\no n t h e\n2. HANSEN, W. J. The impact of storage management\nimplementation of plex processing languages. Tech. Rep.\n9. REYNOLDS, J. C. Cogent programming manual.\nArgonne\nNo. 113, Computer Science Dep., Stanford U., Stanford,\nNat. Lab. Rep. No. ANL-7022, Argonne, Illinois, Mar.\nCalif., 1969.\n1965.\nThe Art oJ Computer Programming, Vol. I.\n3. K~UTH, D . E .\n10. SCHORR, H., AND WXITE, W.M. An efficient machine-inde-\nAddison-Wesley, Menlo Park, Calif., 1968.\npendent procedure for garbage collection in various\nlist\n4. LANG, C. A., AND GRAY, J. C. ASP--A ring implemented\nstructures. Comm. ACM 10, 8 (Aug. 1967), 501-506.\nComm. ACM 11, 8 (Aug. 1968),\nassociative structure package.\n11. STYGAR, P. LISP 2 garbage collector specifications. TM-\n550-555.\n3417/500/00, System Development Corp., Santa Monica,\nL I S P 1.5 Programmer's Manual.\n5. MCCARTHY, J., ET AL.\nCalif., Apr. 1967.\nMIT Press, Cambridge, Mass., 1962.\n12. WISEMAN, N. E. A simple list processing package for the\n6. MINSKY, M. L. A LISP garbage collector using serial sec-\nPDP-7. In DECUS Second European Seminar, Aachen,\nondary storage. MIT Artificial Intelligence Memo. No. 58,\nGermany, Oct. 1966, pp. 37-42.\nMIT, Cambridge, Mass., Oct. 1963.\n\nthen used to translate a more elaborate one, and so forth,\nA Base for a Mobile\nuntil the desired level of complexity is reached.\nThis paper is a complete description of the first stage of\nProgramming System\nsuch a bootstrapping procedure. I t is organized as follows:\nin Section 2, the processing performed b y the simple com-\nRICHARD J. OR~ASS\npiler ( S I M C M P ) ; in Section 3, some examples of its use;\nI B M Thomas J . Watson Research Center\nin Section 4, the environment which m u s t be coded for a\nYorktown Heights, N e w York\nparticular computing machine; and in Section 5,\nthe\nS I M C M P algorithm.\nAND\n2. S p e c i f i c a t i o n s for S I M C M P\nWILLIAM\nM. WHITE\nUniversity of Colorado, Boulder, Colorado\nT h e algorithm described in this paper was constructed\nto provide a compiler of m i n i m u m length and complexity\nwhich is adequate to serve as the base for the implemen-\nAn algorithm for a macro processor which has been used as the\ntation, b y bootstrapping, of programming systems.\nbase of an implementation, by bootstrapping, of processors\nS I M C M P is essentially a v e r y simple macro processor.\nfor programming languages is described. This algorithm can\nSource language statements are defined in terms of their\nbe easily implemented on contemporary computing machines.\nobject code translations. These definitions are stored in a\nExperience with programming languages whose implementa-\ntable. A source p r o g r a m is translated one line at a time.\ntion is based on this algorithm indicates that such a language\nThe input line is compared with all of the entries in the\ncan be transferred to a new machine in less than one man-week\ntable. W h e n a m a t c h occurs, the object code translation\nwithout using the old machine.\nof the input line, with appropriate p a r a m e t e r substitu-\nKEY WORDS AND PHRASES: bootstrapping, macro processing, machine\ntions, is punched. S I M C M P can be used to translate a n y\nindependence, programming languages,implementationtechniques\nsource language which can be defined b y means of simple\nCR CATEGORIES: 4.12, 4.22\nsubstitution macros with single character parameters.\nSeveral terms as they are used in this paper are illu-\n1. I n t r o d u c t i o n\nstrated here. I n a conventional macro processor, a macro\ndefinition is of the form:\nThe development of m a n y special purpose programming\nlanguages has increased the overhead associated with\nM A C R O N A M E (P1, \" ' \" , P , )\nchanging computing machines and with transferring a\nCode body\nprogramming language from one computer center to\nE N D\nanother. A n u m b e r of writers have proposed t h a t these\nlanguages should be implemented b y bootstrapping. (Since\nT h e strings ' M A C R O ' and ' E N D ' serve to delimit the\nthis work is well known, it is not summarized in this in-\nmacro definition. ' N A M E ' stands for the name of the\ntroduction.)\nmacro, and 'Pi', • \"\" , ' P , ' stands for the formal parameters\nThe description is given of a bootstrapping procedure\nof the macro. This macro is called b y a line of the form\nwhich does not require a running processor on another\n' N A M E (A1, • • • , A~)' where m is less t h a n or equal to n.\nmachine for its implementation. A compiler is described\nWhen this call is encountered in the p r o g r a m text, the\nwhich can be trivially implemented \" b y h a n d \" on con-\ncode body of the macro N A M E is evaluated b y sub-\nt e m p o r a r y computing machines. This simple compiler is\n\nVolume 12 / Number 9 / September, 1969 Communications of the ACM 507\n```\n\nGiven the paper in DOCS, generate a 140 character tweet that\ncaptures the paper idea and make it interesting.\n"
        }
      ]
    }
  ],
  "stream": true
}
``````

</details>

-   retry #1
-   retry #2
-   response: 429 Too Many Requests
### ❌ request error: 429


</details>

### ❌ llm error


```yaml
status: 429
statusText: Too Many Requests
bodyText: '{"message":"timeout waiting for slot; deployment=gcraoai4sw1:gpt-4;
  credit=300/2286/30000;"}'
retryAfter: 1
```
### Request error

-   status: `429`, Too Many Requests
