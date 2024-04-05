## pdf-to-tweet



<details id="📄-spec" class="genaiscript">
<summary>
📄 spec
</summary>


```markdown
# Specification
                
-   [diehard.pdf](./diehard.pdf)
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
-   tokens: 15733

````markdown
DOCS:
```pdf file="src/bztest/diehard.pdf"
University of Massachusetts Amherst
ScholarWorks@UMass Amherst
Computer Science Department Faculty Publication
Computer Science
Series

2006

DieHard: Probabilistic Memory Safety for Unsafe
Languages
Emery D. Berger
University of Massachusetts Amherst

Follow this and additional works at: https://scholarworks.umass.edu/cs_faculty_pubs
Part of the Computer Sciences Commons

Recommended Citation
Berger, Emery D., "DieHard: Probabilistic Memory Safety for Unsafe Languages" (2006). Computer Science Department Faculty
Publication Series. 87.
Retrieved from https://scholarworks.umass.edu/cs_faculty_pubs/87

This Article is brought to you for free and open access by the Computer Science at ScholarWorks@UMass Amherst. It has been accepted for inclusion
in Computer Science Department Faculty Publication Series by an authorized administrator of ScholarWorks@UMass Amherst. For more information,
please contact scholarworks@library.umass.edu.

-------- Page Break --------

DieHard: Probabilistic Memory Safety for Unsafe Languages
Emery D. Berger              Benjamin G. Zorn
Dept. of Computer Science                 Microsoft Research
University of Massachusetts Amherst               One Microsoft Way
Amherst, MA 01003                  Redmond, WA 98052
emery@cs.umass.edu                 zorn@microsoft.com

Abstract                        Dangling pointers: If the program mistakenly frees a live object,
the allocator may overwrite its contents with a new object or
Applications written in unsafe languages like C and C++ are vul-
heap metadata.
nerable to memory errors such as buffer overflows, dangling point-
ers, and reads of uninitialized data. Such errors can lead to pro-  Buffer overflows: Out-of-bound writes can corrupt the contents of
gram crashes, security vulnerabilities, and unpredictable behavior.    live objects on the heap.
We present DieHard, a runtime system that tolerates these errors
Heap metadata overwrites: If heap metadata is stored near heap
while probabilistically maintaining soundness. DieHard uses ran-
objects, an out-of-bound write can corrupt it.
domization and replication to achieve probabilistic memory safety
Uninitialized reads: Reading values from newly-allocated or un-
by approximating an infinite-sized heap. DieHard’s memory man-
allocated memory leads to undefined behavior.
ager randomizes the location of objects in a heap that is at least
twice as large as required. This algorithm prevents heap corruption
Invalid frees: Passing illegal addresses to free can corrupt the
and provides a probabilistic guarantee of avoiding memory errors.
heap or lead to undefined behavior.
For additional safety, DieHard can operate in a replicated mode
Double frees: Repeated calls to free of objects that have already
where multiple replicas of the same application are run simulta-
been freed cause freelist-based allocators to fail.
neously. By initializing each replica with a different random seed
and requiring agreement on output, the replicated version of Die-
Tools like Purify [18] and Valgrind [28, 35] allow programmers to
Hard increases the likelihood of correct execution because errors
pinpoint the exact location of these memory errors (at the cost of a
are unlikely to have the same effect across all replicas. We present
2-25X performance penalty), but only reveal those bugs found dur-
analytical and experimental results that show DieHard’s resilience
ing testing. Deployed programs thus remain vulnerable to crashes
to a wide range of memory errors, including a heap-based buffer
or attack. Conservative garbage collectors can, at the cost of in-
overflow in an actual application.
creased runtime and additional memory [12, 20], disable calls to
free and eliminate three of the above errors (invalid frees, double
Categories and Subject Descriptors D.3.3 [Programming Lan-
frees, and dangling pointers). Assuming source code is available, a
guages]: Dynamic storage management; D.2.0 [Software Engi-
programmer can also compile the code with a safe C compiler that
neering]: Protection mechanisms; G.3 [Probability and Statis-
inserts dynamic checks for the remaining errors, further increasing
tics]: Probabilistic algorithms
running time [1, 3, 27, 41, 42]. As soon as an error is detected, the
inserted code aborts the program.
General Terms Algorithms, Languages, Reliability
While this fail-stop approach is safe, aborting a computation is
often undesirable — users are rarely happy to see their programs
Keywords DieHard, probabilistic memory safety, randomization,
suddenly stop. Some systems instead sacrifice soundness in order
replication, dynamic memory allocation
to prolong execution in the face of memory errors [30, 32]. For
example, failure-oblivious computing builds on a safe C compiler
but drops illegal writes and manufactures values for invalid reads.
1. Introduction
Unfortunately, these systems provide no assurance to programmers
While the use of safe languages is growing, many software ap-
that their programs are executing correctly.
plications are still written in C and C++, two unsafe languages.
This paper makes the following contributions:
These languages let programmers maximize performance but are
error-prone. Memory management errors, which dominate recent
1. It introduces the notion of probabilistic memory safety, a
security vulnerabilities reported by CERT [39], are especially per-
probabilistic guarantee of avoiding memory errors.
nicious. These errors fall into the following categories:
2. It presents DieHard, a runtime system that provides probabilis-
tic memory safety. We show analytically and empirically that
DieHard eliminates or avoids all of the memory errors described
above with high probability.
Permission to make digital or hard copies of all or part of this work for personal or
classroom use is granted without fee provided that copies are not made or distributed
for profit or commercial advantage and that copies bear this notice and the full citation
2. Overview
on the first page. To copy otherwise, to republish, to post on servers or to redistribute
DieHard provides two modes of operation: a stand-alone mode
to lists, requires prior specific permission and/or a fee.
that replaces the default memory manager, and a replicated mode
PLDI’06 June 11–14, 2006, Ottawa, Ontario, Canada.
Copyright c© 2006 ACM 1-59593-320-4/06/0006. . . $5.00.
that runs several replicas simultaneously. Both rely on a novel

-------- Page Break --------

randomized memory manager that allows the computation of the  2.1 Outline
exact probabilities of detecting or avoiding memory errors.
The rest of this paper is organized as follows. Section 3 formal-
The DieHard memory manager places objects randomly across
izes the notions of probabilistic memory safety and infinite-heap
a heap whose size is a multiple of the maximum required (Figure 1
semantics, which probabilistic memory safety approximates. Sec-
shows an example heap layout). The resulting spacing between ob-
tion 4 then presents DieHard’s fast, randomized memory allocator
jects makes it likely that buffer overflows end up overwriting only
that forms the heart of the stand-alone and replicated versions. Sec-
empty space. Randomized allocation also makes it unlikely that a
tion 5 describes DieHard’s replicated variant. Section 6 presents
newly-freed object will soon be overwritten by a subsequent allo-
analytical results for both versions, and Section 7 provides empiri-
cation, thus avoiding dangling pointer errors. It also improves app-
cal results, measuring overhead and demonstrating DieHard’s abil-
lication robustness by segregating all heap metadata from the heap
ity to avoid memory errors. Sections 8 discusses related work, and
(avoiding most heap metadata overwrites) and ignoring attempts to
Section 9 concludes with a discussion of future directions.
free already-freed or invalid objects. Despite its degradation of
spatial locality, we show that the DieHard memory manager’s im-
3. Probabilistic Memory Safety
pact on performance is small for many applications (average 8%
across the SPECint2000 benchmark suite), and actually improves
For the purposes of this paper, we define a program as being fully
the performance of some applications when running on Windows
memory safe if it satisifies the following criteria: it never reads
XP.
uninitialized memory, performs no illegal operations on the heap
While the stand-alone version of DieHard provides substantial
(no invalid/double frees), and does not access freed memory (no
protection against memory errors, the replicated version both in-
dangling pointer errors).
creases the protection and detects errors caused by illegal reads. In
By aborting a computation that might violate one of these con-
this mode of operation, DieHard executes multiple replicas of the
ditions, a safe C compiler provides full memory safety. However,
same program simultaneously, each with different seeds to their
we would ideally like an execution environment that would allow
respective randomized allocators. Errors like buffer overflows are
such programs to continue to execute correctly (soundly) in the face
thus likely to overwrite different areas of memory in the different
of these errors.
replicas. DieHard intercepts output from all of the various replicas
We can define such an idealized, but unrealizable, runtime sys-
and compares the contents of each before transmitting any output.
tem. We call this runtime system an infinite-heap memory man-
With high probability, whenever any two programs agree on their
ager, and say that it provides infinite-heap semantics. In such a
output, they executed safely. In other words, in any agreeing repli-
system, the heap area is infinitely large, so there is no risk of heap
cas, any buffer overflows only overwrote dead data, and dangling
exhaustion. Objects are never deallocated, and all objects are al-
pointers were never overwritten. If an application’s output depends
located infinitely far apart from each other (that is, they can be
on uninitialized data, these data will be different across the replicas,
thought of as boundless memory blocks [31]).
and thus DieHard will detect them.
From the standpoint of a correct C execution, a program that
Since replacing the heap with DieHard significantly improves
does not deliberately seek to exhaust the heap cannot tell whether
reliability, we believe that it is suitable for broad deployment, es-
it is running with an ordinary heap implementation or an infinite
pecially in scenarios where increased reliability is worth the space
heap. However, infinite-heap semantics allows programs to execute
cost. For example, a buggy version of the Squid web caching server
safely that would be rejected by a safe C compiler. Because every
crashes on ill-formed inputs when linked with both the default
object is infinitely far from every other object, heap buffer over-
GNU libc allocator and the Boehm-Demers-Weiser garbage collec-
flows are benign — they never overwrite live data. The problems
tor, but runs correctly with DieHard. Using additional replicas can
of heap corruption and dangling pointers also vanish because frees
further increase reliability. While additional replicas would natu-
are ignored and allocated objects are never overwritten. However,
rally increase execution time on uniprocessor platforms, we believe
uninitialized reads to the heap remain undefined. Unlike Java, the
that the natural setting for using replication is on systems with mul-
contents of newly-allocated C and C++ objects are not necessarily
1
tiple processors. It has proven difficult to rewrite applications to
defined.
take advantage of multiple CPUs in order to make them run faster.
DieHard can instead use the multiple cores on newer processors to
3.1 Approximating infinite heaps
make legacy programs more reliable.
While an infinite-heap memory manager is unimplementable, we
can probabilistically approximate its behavior. We replace the in-
finite heap with one that is M times larger than the maximum re-
quired to obtain an M-approximation to infinite-heap semantics. By
placing objects uniformly at random across the heap, we get a min-
imum expected separation of E[minimum separation] = M − 1 ob-
L = max live size ≤ H/2 F = free = H-L
jects, making overflows smaller than M − 1 objects benign. Finally,
by randomizing the choice of freed objects to reclaim, recently-
freed objects are highly unlikely to be overwritten.
…
replica 1
2 3 1
i                    i+1
3.2 Detecting uninitialized reads
object size = 2      object size = 2
This memory manager approximates most aspects of infinite-heap
H = max heap size, class i
semantics as M approaches infinity. However, it does not quite cap-
ture infinite-heap semantics, because it does not detect uninitialized
reads. In order to detect these, we require that the infinite heap and
…
replica 2
1 3 2
every allocated object be filled with random values. We can then
detect uninitialized reads by simultaneously executing at least two
Figure 1. DieHard’s heap layout. The heap is divided into separate
replicas with different randomized allocators and comparing their
regions, within which objects are laid out randomly. Notice the
1
different layouts across replicas.
ISO C++ Standard 5.3.4, paragraph 14A.

-------- Page Break --------

outputs. An uninitialized read will return different results across the
1 void DieHardInitHeap (int MaxHeapSize) {
replicas, and if this read affects the computation, the outputs of the
2 // Initialize the random number generator
replicas will differ.
3 // with a truly random number.
4 rng.setSeed (realRandomSource);
5 // Clear counters and allocation bitmaps
4. Randomized Memory Management
6 // for each size class.
This section describes the randomized memory management algo-
7 for (c = 0; c < NumClasses; c++) {
rithm that approximates the infinite heap semantics given above.
8 inUse[c] = 0;
We first describe the algorithm’s initialization phase, and then
9 isAllocated[c].clear();
describe the allocation and deallocation algorithms. For pur-
10 }
poses of exposition, we refer to these as DieHardMalloc and
11 // Get the heap memory.
DieHardFree, but in the actual implementation, these are sim-
12 heap = mmap (NULL, MaxHeapSize);
ply called malloc and free. We use interposition to replace the
13 // REPLICATED: fill with random values
calls in the target application; see Section 5.1 for details.
14 for (i = 0; i < MaxHeapSize; i += 4)
15 ((long
*) heap)[i] = rng.next();
4.1 Initialization
16 }
The initialization step first obtains free memory from the system
using mmap. The heap size is a parameter to the allocator, corre-
1 void DieHardMalloc (size_t sz) {
*
sponding to the M factor described above. For the replicated ver-
2 if (sz > MaxObjectSize)
sion only, DieHard then uses its random number generator to fill
3 return allocateLargeObject(sz);
the heap with random values. Each replica’s random number gen-
4 c = sizeClass (sz);
erator is seeded with a true random number. For example, the Linux
5 if (inUse[c] == PartitionSize / (M *sz))


version reads from /dev/urandom, a source of true randomness.
6 // At threshold: no more memory.
The random number generator is an inlined version of Marsaglia’s
7 return NULL;
multiply-with-carry random number generation algorithm, which
8 // Probe for a free slot.
is a fast, high-quality source of pseudo-random numbers [26].
9 do {
The heap is logically partitioned into twelve regions, one for
10 index = rng.next() % bitmap size;
each power-of-two size class from 8 bytes to 16 kilobytes. Each
11 if (!isAllocated[c][index]) {
region is allowed to become at most 1/M full. DieHard allocates
12 // Found one.
larger objects directly using mmap and places guard pages without
13 // Pick pointer corresponding to slot.
read or write access on either end of these regions. Object requests
14 ptr = PartitionStart + index * sz;
are rounded up to the nearest power of two. Using powers of two
15 // Mark it allocated.
significantly speeds allocation by allowing expensive division and
16 inUse[c]++;
modulus operations to be replaced with bit-shifting. This organi-
17 isAllocated[c][index] = true;
zation also allows DieHard to efficiently prevent heap overflows
18 // REPLICATED: fill with random values.
caused by unsafe library functions like strcpy, as we describe in
19 for (i = 0; i < getSize(c); i += 4)
Section 4.4.
20 ((long
*) ptr)[i] = rng.next();
Separate regions are crucial to making the allocation algorithm
21 return ptr;
practical. If instead objects were randomly spread across the en-
22 }
tire heap area, significant fragmentation would be a certainty, be-
23 } while (true);
cause small objects would be scattered across all of the pages. Re-
24 }
stricting each size class to its own region eliminates this external
fragmentation. We discuss DieHard’s memory efficiency further in
Section 4.5.
1 void DieHardFree (void ptr) {
*
Another vital aspect of the algorithm is its complete separation
2 if (ptr is not in the heap area)
of heap metadata from heap objects. Many allocators, including
3 freeLargeObject(ptr);
the Lea allocator that forms the basis of the GNU libc allocator,
4 c = partition ptr is in;
store heap metadata in areas immediately adjacent to allocated ob-
5 index = slot corresponding to ptr;
jects (“boundary tags”). A buffer overflow of just one byte past an
6 // Free only if currently allocated;
allocated space can corrupt the heap, leading to program crashes,
7 if (offset correct &&
unpredictable behavior, or security vulnerabilities [23]. Other allo-
8 isAllocated[c][index]) {
cators place such metadata at the beginning of a page, reducing but
9 // Mark it free.
not eliminating the likelihood of corruption. Keeping all of the heap
10 inUse[c]--;
metadata separate from the heap protects it from buffer overflows.
11 isAllocated[c][index] = false;
The heap metadata includes a bitmap for each heap region,
12 } // else, ignore
where one bit always stands for one object. All bits are initially
13 }
zero, indicating that every object is free. Additionally, DieHard
tracks the number of objects allocated to each region (inUse); this
Figure 2. Pseudocode for DieHard heap initialization, object allo-
number is used to ensure that the number of objects does not exceed
cation and deallocation routines.
the threshold factor of 1/M in the partition.

4.2 Object Allocation
When an application requests memory from DieHardMalloc,
to satisfy the request, which uses mmap and stores the address
the allocator first checks to see whether the request is for a large
in a table for validity checking by DieHardFree. Otherwise, it
object (larger than 16K); if so, it uses allocateLargeObject
converts the size request into a size class (dloge of the request,
2

-------- Page Break --------

minus 3). As long as the corresponding region is not already full, it  Locality
then looks for space.
Many allocators attempt to increase spatial locality by placing ob-
Allocation then proceeds much like probing into a hash table.
jects that are allocated at the same time near each other in mem-
The allocator picks a random number and checks to see if the slot in
ory [11, 14, 25, 40]. DieHard’s random allocation algorithm instead
the appropriate partition is available. The fact that the heap can only
makes it likely that such objects will be distant. This spreading out
become 1/M full bounds the expected time to search for an unused
of objects has little impact on L1 locality because typical heap ob-
1
slot to
. For example, for M = 2, the expected number of
jects are near or larger than the L1 cache line size (32 bytes on
1−(1/M)
probes is two.
the x86). However, randomized allocation leads to a large number
After finding an available slot, the allocator marks the object
of TLB misses in one application (see Section 7.2.1), and leads to
as allocated, increments the allocated count, and, for the replicated
higher resident set sizes because it can induce poor page-level lo-
version, fills the object with randomized values. DieHard relies on
cality. To maintain performance, the in-use portions of the DieHard
this randomization to detect uninitialized reads, as we describe in
heap should fit into physical RAM.
Section 5.
Space Consumption
4.3 Object Deallocation
DieHard’s memory management policies tend to consume more
memory than conventional memory allocators. This increase in
To defend against erroneous programs, DieHardFree takes sev-
memory is caused by two factors: rounding up objects to the next
eral steps to ensure that any object given to it is in fact valid.
power of two, and requiring that the heap be M times larger than
First, it checks to see if the address to be freed is inside the
necessary.
heap area, indicating it may be a large object. Because all large
The rounding up of objects to the next power of two can, in the
objects are mmaped on demand, they lie outside of the main
worst-case, increase memory consumption by up to a factor of two.
heap. The function freeLargeObject checks the table to en-
Wilson et al. present empirical results suggesting that this policy
sure that this object was indeed returned by a previous call to
can lead to significant fragmentation [40]. Nonetheless, such an
allocateLargeObject. If so, it munmaps the object; oth-
allocator is used in real systems, FreeBSD’s PHKmalloc [24], and
erwise, it ignores the request.
is both time and space-efficient in practice [14].
If the address is inside the small-object heap, DieHard checks
Any increase in memory consumption caused by rounding is
it for validity to prevent double and invalid frees. First, the offset
balanced by two DieHard features that reduce memory consump-
of the address from the start of its region (for the given size class)
tion. First, unlike most conventional allocators including the GNU
must be a multiple of the object size. Second, the object must be
libc allocator, DieHard’s allocator has no per-object headers. These
currently marked as allocated. If both of these conditions hold,
headers typically consume eight bytes, but DieHard’s per-object
DieHard finally resets the bit corresponding to the object location
overhead is just one bit in the allocation bitmap. Second, while
in the bitmap and decrements the count of allocated objects for this
coarse size classes can increase internal fragmentation, DieHard’s
region.
use of segregated regions completely eliminates external frag-
mentation. The Lea allocator’s external fragmentation plus per-
4.4 Limiting Heap Buffer Overflows
object overhead increases memory consumption by approximately
20% [14].
While randomizing the heap provides probabilistic protection
A more serious concern is the requirement of a factor of M ad-
against heap buffer overflows (see Section 6.1), DieHard’s heap
ditional space for each of the twelve size classes, and the use of
layout makes it efficient to prevent overflows caused by unsafe
replicas. In the worst case, a program using DieHard could request
library functions like strcpy. DieHard replaces these unsafe li-
objects of just one size and so require up to 12M more memory
brary functions with variants that do not write beyond the allocated
than needed. We could reduce this overhead using profile informa-
area of heap objects. Each function first checks if the destination
tion to reserve only M times the maximum needed for each size
pointer lies within the heap (two comparisons). If so, it finds the
class. However, Robson showed that this factor (a logarithm of the
start of the object by bitmasking the pointer with its size (com-
ratio of the largest size to the smallest) is the worst case for all
puted with a bitshift) minus one. DieHard then computes the avail-
memory allocators [34]. Approaches like conservative garbage col-
able space from the pointer to the end of the object (two subtrac-
lection can impose an additional space overhead of 3X-5X over
tions). With this value limiting the maximum number of bytes to
malloc/free [20, 44]. Finally, memory that is reserved by Die-
be copied, DieHard prevents strcpy from causing heap buffer
Hard but not used does not consume any virtual memory; the ac-
overflows.
tual implementation of DieHard lazily initializes heap partitions.
In addition to replacing strcpy, DieHard also replaces its
Nonetheless, DieHard’s approach reduces the available address
“safe” counterpart, strncpy. This function requires a length ar-
space, which may make it unsuitable for applications with large
gument that limits the number of bytes copied into the destina-
heap footprints running on 32-bit systems. We expect the problem
tion buffer. The standard C library contains a number of these
of reduced address space will become less of an issue as 64-bit
checked library functions in an attempt to reduce the risk of
processors become commonplace. We also believe that DieHard’s
buffer overflows. However, checked functions are little safer than
space-reliability tradeoff will be acceptable for many purposes, es-
their unchecked counterparts, since programmers can inadvertently
pecially long-running applications with modest-sized heaps.
specify an incorrect length. As with strcpy, the DieHard version
of strncpy checks the actual available space in the destination
object and uses that value as the upper bound.
5. Replication
While replacing an application’s allocator with DieHard reduces
4.5 Discussion
the likelihood of memory errors, this stand-alone approach cannot
detect uninitialized reads. To catch these errors, and to further in-
The design of DieHard’s allocation algorithm departs significantly
crease the likelihood of correct execution, we have built a version of
from previous memory allocators. In particular, it makes no effort
DieHard (currently for UNIX platforms only) that executes several
to improve locality and can increase space consumption.

-------- Page Break --------

replicas simultaneously. Figure 3 depicts the architecture, instanti-    Any non-agreeing replicas have either exited abnormally before
ated with three replicas.                   filling their output buffers, or produced different output. Whenever
The diehard command takes three arguments: the path to the  a replica crashes, DieHard receives a signal and decrements the
replicated variant of the DieHard memory allocator (a dynamically-  number of currently-live replicas. A replica that has generated
loadable library), the number of replicas to create, and the applica-  anomalous output is no longer useful since it has entered into
tion name.                         an undefined state. Our current implementation kills such failed
replicas and decreases the currently-live replica count. To further
improve availability, we could replace failed replicas with a copy
5.1 Replicas and Input
of one of the “good” replicas with its random number generation
DieHard spawns each replica in a separate process, each with
seed set to a different value.
the LD PRELOAD environment variable pointing to the DieHard
memory management library libdiehard.so. This library in-
5.3 Discussion
terposition redirects all calls to malloc and free in the applica-
Executing applications simultaneously on the same system while
tion to DieHard’s memory manager. Because the memory manager
both providing reasonable performance and preserving application
picks a different random number generation seed on every invoca-
semantics is a challenge. We address these issues here.
tion, all replicas execute with different sequences of random num-
In order to make correct replicas output-equivalent to the ex-
bers.
tent possible, we intercept certain system calls that could produce
DieHard uses both pipes and shared memory to communicate
different results. In particular, we redirect functions that access the
with the replicas. Each replica receives its standard input from Die-
date and system clock so that all replicas return the same value.
Hard via a pipe. Each replica then writes its standard output into a
While it may appear that voting on all output might be expen-
memory-mapped region shared between DieHard and the replica.
sive, it is amortized because this processing occurs in 4K chunks.
After all I/O redirection is established, each replica begins exe-
More importantly, voting is only triggered by I/O, which is already
cution, receiving copies of standard input from the main DieHard
expensive, and does not interfere with computation.
process.
A disadvantage of the barrier synchronization employed here is
While the stand-alone version of DieHard works for any pro-
that an erroneous replica could theoretically enter an infinite loop,
gram, the replicated DieHard architecture is intended for programs
which would cause the entire program to hang because barrier syn-
whose output is inherently non-deterministic. The current imple-
chronization would never occur. There are two approaches that one
mentation is targeted at standard UNIX-style commands that read
can take: use a timer to kill replicas that take too long to arrive at
from standard input and write to standard output. Also, while we
the barrier, or ignore the problem, as we currently do. Establishing
intend to support programs that modify the filesystem or perform
an appropriate waiting time would solve the problem of consensus
network I/O, these are not supported by the current version of the
in the presence of Byzantine failures, which is undecidable [15].
replicated system. We leave the use of DieHard replication with
interactive applications as future work.
6. Analysis
5.2 Voting
While DieHard is immune to heap corruption caused by double
frees, invalid frees, and heap metadata overwrites caused by over-
DieHard manages output from the replicas by periodically synchro-
flow, its immunity to other memory errors is probabilistic. In this
nizing at barriers. Whenever all currently-live replicas terminate or
section, we quantify the probabilistic memory safety provided by
fill their output buffers (currently 4K each, the unit of transfer of
both the stand-alone and replicated versions of DieHard. We derive
a pipe), the voter compares the contents of each replica’s output
equations that provide lower bounds on the likelihood of avoiding
buffer. If all agree, then the contents of one of the buffers are sent
buffer overflow and dangling pointer errors, and detecting unini-
to standard output, and execution proceeds as normal.
tialized reads. We assume that the heap metadata, which is placed
However, if not all of the buffers agree, it means that at least one
randomly in memory and protected on either side by guard pages,
of the replicas has an error. The voter then chooses an output buffer
is not corrupted.
agreed upon by at least two replicas and sends that to standard out.
We use the following notation throughout the analyses. Recall
Two replicas suffice, because the odds are slim that two randomized
that M denotes the heap expansion factor that determines how large
replicas with memory errors would return the same result.
the heap is relative to the maximum application live object size.
We use k for the number of replicas, H the maximum heap size,
L the maximum live size (L ≤ H/M), and F the remaining free
space (H − L). Figure 1 depicts these variables graphically. When
analyzing buffer overflows, we use O to stand for the number of
seed
replica
1
objects’ worth of bytes overflowed (e.g., a 9-byte overflow could
overwrite O = 2 8-byte objects). For dangling pointer errors, we
output
input
use A to denote the number of allocations that have taken place
seed
replica
2
after a premature call to free.
We make a simplifying and conservative assumption in these
seed
replica
vote
broadcast
analyses that all object requests are for a specific size class. This
3
approach is conservative because the separation of different size
execute
classes improves the odds of avoiding memory errors. We also
randomized
assume that there is either one replica or at least three, since the
replicas
voter cannot decide which of two disagreeing replicas is the correct
one.
Figure 3. The replicated DieHard architecture. Input is broad-
Note that the analyses below quantify the probability of avoid-
cast to multiple replicas, each equipped with a different, fully-
ing a single error of a given type. One can calculate the probabil-
randomized memory manager. Output is only committed when at
ity of avoiding multiple errors by multiplying the probabilities of
least two replicas agree on the result.
avoiding each error, although this computation depends on an as-

-------- Page Break --------

Probability of Avoiding Dangling Pointer Error
Probability of Avoiding Buffer Overflow

100 allocs 1000 allocs 10,000 allocs
1/8 full 1/4 full 1/2 full

100%
100%
90%
90%
80%
80%
70%
70%
60%
60%
50%
50%
40%
40%
Probability
Probability
30%
30%
20%
20%
10%
10%
0%
0%
1 3 4 5 6
8 16 32 64 128 256
Replicas
Object size (bytes)
(a) Probability of masking single-object buffer overflows for varying    (b) Probability of masking dangling pointer errors using the stand-alone
replicas and degrees of heap fullness.                  version of DieHard in its default configuration, for varying object sizes
and intervening allocations.

Figure 4. Probabilities of avoiding buffer overflows and dangling pointer errors.

sumption of independence that may not hold. Also, these results  is, the call to free should have happened at some point after the
only hold for objects smaller than 16K in size, because larger ob-  next A calls to malloc but before the A + 1th call. Avoiding a
jects are managed separately as described in Section 4.1.      dangling pointer error is thus the likelihood that some replica has
not overwritten the object’s contents after A allocations:
6.1 Masking Buffer Overflows
Theorem 2. Let Overwrites be the number of times that a partic-
In this section, we derive the probability of masking buffer over-
ular freed object of size S gets overwritten by one of the next A
flows. While buffer overflows are generally writes just beyond an
allocations. Then the probability of this object being intact after A
allocated object, for our analysis, we model a buffer overflow as
allocations, assuming A ≤ F/S and k  6= 2, is:
a write to any location in the heap. If a buffer overflow does not
)
(
overwrite any live data in at least one replica’s heap, we say that
k
A
the buffer overflow has been successfully masked. The following
.
P(Overwrites = 0) ≥ 1 −
F/S
formula gives the probability of successfully masking a buffer over-
flow.
Theorem 1. Let OverflowedObjects be the number of live objects
Proof. The prematurely freed object is indexed by one of the Q =
overwritten by a buffer overflow. Then for k  6= 2, the probability of
F/S bits in the allocation bitmap for its size class. The odds of a
masking a buffer overflow is
new allocation not overwriting that object are thus (Q − 1)/Q. As-
]
[
k
)
(
sume that after each allocation, we do not free an object, which
O
F
.
P(OverflowedObjects = 0) = 1 −1 −
H
is the worst case. After the second allocation, the odds are (Q −
1)/Q ∗ (Q − 2)/(Q − 1) = (Q − 2)/Q. In general, after A alloca-
tions, the probability of not having overwritten a particular slot is
(Q − A)/Q.
Proof. The odds of O objects overwriting at least one live object are
The probability that no replica has overwritten a particular ob-
F
O
1 minus the odds of them overwriting no live objects, or 1 − ( ).
H
ject after A allocations is then one minus the odds of all of the
Masking the buffer overflow requires that at least one of the k
k
replicas overwriting that object, or 1 − (1 − (Q − A)/Q)= 1 −
replicas not overwrite any live objects, which is the same as 1 minus
k
(A/(F/S)).
F
Ok
all of them overwriting at least one live object = 1 − (1 − (
)).
H
This result shows that DieHard is robust against dangling
pointer errors, especially for small objects. Using the default con-
Probabilistic memory safety provides good protection against
figuration, the stand-alone version of DieHard has greater than a
modest buffer overflows. Whenever the heap is large relative to the
99.5% chance of masking an 8-byte object that was freed 10,000
maximum amount of live memory, the likelihood of masking an
allocations too soon. Figure 4(b) shows the probabilities of avoid-
error increases. For example, when the heap is no more than 1/8
ing dangling pointer errors for different object sizes and numbers
full, DieHard in stand-alone mode provides an 87.5% chance of
of intervening allocations.
masking a single-object overflow, while three replicas avoids such
6.3 Detecting uninitialized reads
errors with greater than 99% probability. Figure 4(a) shows the
probability of protecting against overflows for different numbers
We say that DieHard detects an uninitialized read when it causes all
of replicas and degrees of heap fullness.
of the replicas to differ on their output, leading to termination. An
uninitialized read is a use of memory obtained from an allocation
6.2 Masking Dangling Pointers
before it has been initialized. If an application relies on values read
A dangling pointer error occurs when an object is freed prematurely  from this memory, then its behavior will eventually reflect this use.
and its contents are overwritten by another object. Suppose that the  We assume that uninitialized memory reads are either benign or
object should have been freed A allocations later than it was; that  propagate to output.

-------- Page Break --------

The odds of detecting such a read thus depend both on how  the replacement of unsafe library functions (see Section 4.4) for
much use the application makes of the uninitialized memory, and  these experiments to isolate the protection that randomization and
its resulting impact on the output. An application could widen the  replication provide.
uninitialized data arbitarily, outputting the data in an infinite loop.
7.2 Overhead
On the other end of the spectrum, an application might narrow the
data by outputting just one bit based on the contents of the entire
We run our benchmarks on three different platforms: Linux, Win-
uninitialized region. For example, it could output an ‘A’ if the first
dows XP, and Solaris. The Linux platform is a dual-processor Intel
bit in the region was a 0, and ‘a’ if it was 1.
Xeon system with each 3.06GHz processor (hyperthreading active)
If we assume that the application generates just one bit of output
equipped with 512K L2 caches and with 3 gigabytes of RAM. All
based on every bit in the uninitialized area of memory, we get the
code on Linux is compiled with g++ version 4.0.2. The Windows
following result:
XP platform is a Pentium 4 system running at 3.20GHz with a 512K
L2 cache and 2 gigabytes of RAM. All code on Windows is com-
Theorem 3. The probability of detecting an uninitialized read
piled using Visual Studio 7. The Solaris platform is a Sun SunFire
of B bits in k replicas (k > 2) in a non-narrowing, non-widening
6800 server, with 16 900MHz UltraSparc v9 processors and 16 gi-
computation is:
gabytes of RAM; code there is compiled with g++ 3.2. All code is
compiled at the highest optimization level on all platforms. Tim-
B
2!
ings are performed while the systems are quiescent. We report the
P(Detect uninitialized read) = .
B Bk
(2− k)!2
average of five runs after one warm-up run; observed variances are
below 1%.
7.2.1 Linux
Proof. For DieHard to detect an uninitialized read, all replicas must
On Linux, we compare both DieHard and the Boehm-Demers-
disagree on the result stemming from the read. In other words,
Weiser collector to the default GNU libc allocator, a variant of the
all replicas must have filled in the uninitialized region of length
B
Lea allocator [25]. The Boehm-Demers-Weiser collector is used
B with a different B-bit number. There are 2numbers of length B,
Bk
for comparison because it represents an alternative trade-off in the
and k replicas yields 2 possible combinations of these numbers.
B  B
design space between space, execution time, and safety guarantees.
There are (2)!/(2−k)! ways of selecting different B-bit numbers
B
Figure 5(a) shows that, for the allocation-intensive benchmarks,
across the replicas (assuming 2> k). We thus have a likelihood of
DieHard suffers a performance penalty ranging from 16.5% to
B  B Bk
detecting an uninitialized read of (2!)/(2− k)!2.
63% (geometric mean: 40%). Its overhead is thus somewhat higher
than that suffered by the Boehm-Demers-Weiser collector (2% to
Interestingly, in this case, replicas lower the likelihood of mem-
59.7%, geometric mean 25.8%).
ory safety. For example, the probability of detecting an uninitial-
However, DieHard’s runtime overhead is substantially lower for
ized read of four bits across three replicas is 82%, while for four
most of the SPECint2000 benchmarks. The geometric mean of Die-
replicas, it drops to 66.7%. However, this drop has little practical
Hard’s overhead is 12%. DieHard degrades performance substan-
impact for reads of more data. The odds of detecting an unini-
tially for two applications: 253.perlbmk (48.8%) and 300.twolf
tialized read of 16 bits drops from 99.995% for three replicas to
(109%). The 253.perlbmk benchmark is allocation-intensive,
99.99% for four replicas.
spending around 12.5% of its execution doing memory operations,
DieHard’s effectiveness at finding uninitialized reads makes it
highlighting both DieHard’s and Boehm-Demers-Weiser’s runtime
useful as an error-detecting tool during development. During ex-
overhead (13.4%). However, the 300.twolf overhead is due not to
periments for this paper, we discovered uninitialized reads in sev-
the cost of allocation but to TLB misses. 300.twolf uses a wide
eral benchmarks. The replicated version of DieHard typically ter-
range of object sizes. In DieHard, accesses to these objects are
minated in several seconds. We verified these uninitialized read er-
spread over many size class partitions.
rors with Valgrind, which ran approximately two orders of magni-
tude slower.
7.2.2 Windows
To evaluate the effect of different default allocators and compil-
7. Experimental Results
ers on DieHard’s overhead, we ran the allocation-intensive bench-
We first measure the runtime impact of the DieHard memory man-
marks on Windows XP. Figure 5(b) presents execution time results
ager on a suite of benchmark applications. We then empirically
for these benchmarks.
evaluate its effectiveness at avoiding both injected faults and actual
The results on Windows XP are far different than for Linux:
bugs.
the geometric mean of performance for these allocation-intensive
benchmarks with DieHard is effectively the same as with the de-
7.1 Benchmarks
fault allocator. DieHard improves runtime performance for roboop
by 19%, espresso by 8.2%, and cfrac by 6.4%. Only lindsay and
We evaluate DieHard’s performance with both the full SPECint2000
p2c perform slower, by 13.6% and 22.5% respectively.
suite [37] running reference workloads, as well as a suite of
We attribute these results to two factors: first, the default Win-
allocation-intensive benchmarks. These benchmarks perform be-
dows XP allocator is substantially slower than the Lea allocator.
tween 100,000 and 1,700,000 memory operations per second (see
Second, Visual Studio produces much faster code for DieHard than
Berger, Zorn and McKinley [6] for a detailed description). We
g++ does. DieHard is written in modular C++ code with many
include these benchmarks both because they are widely used in
small methods, and Visual Studio’s better inlining heuristics and
memory management studies [5, 17, 22] and because their unusu-
backend code generator combine to substantially improve Die-
ally high allocation-intensity stresses memory management perfor-
Hard’s performance.
mance.
In all of our experiments, we set the default heap size for Die-
7.2.3 Solaris: Replicated Experiments
Hard to 384MB, where up to 1/2 is available for allocation. This
To quantify the overhead of the replicated framework and verify
is larger than necessary for nearly all of the applications we mea-
its scalability, we measure running time with sixteen replicas on a
sure here, but ensures consistency in our results. We also disable

-------- Page Break --------

Runtime on Linux
Runtime on Windows
malloc GC DieHard
malloc DieHard
2.5
2.5
alloc-intensive general-purpose
2
2

1.5
1.5

1
1
0.5
Normalized runtime
0.5
Normalized runtime
0
p2c
cfrac
175.vpr
lindsay
176.gcc
181.mcf
roboop
0
252.eon
254.gap
164.gzip
espresso
256.bzip2
300.twolf
186.crafty
197.parser
255.vortex
Geo. Mean                            Geo. Mean
cfrac espresso lindsay p2c roboop Geo. Mean
253.perlbmk

(a) Linux: Performance of the default malloc, the Boehm-Demers-    (b) Windows XP: Performance of the default malloc and DieHard
Weiser garbage collector, and DieHard (stand-alone version), across a    (stand-alone version), across a range of allocation-intensive benchmark
range of allocation-intensive and general-purpose benchmark applications.    applications.

Figure 5. Runtime performance on Linux and Windows XP.

16-way Sun server. We ran these experiments with the allocation-   We then injected buffer overflow errors at a 1% rate (1 out of
intensive benchmark suite, except for lindsay, which has an unini-  every 100 allocations), under-allocating object requests of 32 bytes
tialized read error that DieHard detects and terminates. Running 16  or more by 4 bytes. With the default allocator, espresso crashes
replicas simultaneously increases runtime by approximately 50%  in 9 out of 10 runs and enters an infinite loop in the tenth. With
versus running a single replica with the replicated version of the  DieHard, it runs successfully in all 10 of 10 runs.
). Part of this cost is due to process
runtime (libdiehard r.so
creation, which longer-running benchmarks would amortize. This
Real Faults
result shows that while voting and interprocess communication im-
We also tested DieHard on an actual buggy application. Version
pose some overhead, the replicated framework scales to a large
2.3s5 of the Squid web cache server has a buffer overflow error
number of processors.
that can be triggered by an ill-formed input. When faced with this
input and running with either the GNU libc allocator or the Boehm-
7.3 Error Avoidance
Demers-Weiser collector, Squid crashes with a segmentation fault.
Using DieHard in stand-alone mode, the overflow has no effect.
We evaluate DieHard’s effectiveness at avoiding both artificially-
injected bugs and actual bugs in a real application, the Squid web
caching server.
8. Related Work
This section describes related work in software engineering, fault
7.3.1 Fault Injection
tolerance, memory management, approaches to address security
We implement two libraries that inject memory errors into unal-  vulnerabilities, failure masking, fail-stop, debugging and testing.
tered applications running on UNIX platforms to explore the re-  Table 1 summarizes how DieHard and the systems described here
handle memory safety errors.
silience of different runtime systems to memory errors including
Our approach is inspired by N-version programming, in which
buffer overflows and dangling pointers.
independent programmers produce variants of a desired pro-
We first run the application with a tracing allocator that gen-
 N-version programming relies on a conjecture
gram [2]. Whereas
erates an allocation log. Whenever an object is freed, the library
of independence across programmers to reduce the likelihood of
outputs a pair, indicating when the object was allocated and when
errors, DieHard provides hard analytical guarantees.
it was freed (in allocation time). We then sort the log by allocation
Fault tolerance: DieHard’s use of replicas with a voter process
time and use a fault-injection library that sits between the appli-
is closely related to Bressoud and Schneider’s hypervisor-based
cation and the memory allocator. The fault injector triggers errors
system, which provides fault tolerance in the face of fail-stop exe-
probabilistically, based on the requested frequencies. To trigger an
cutions [10]. In addition to supporting replication and voting, their
underflow, it requests less memory from the underlying allocator
hypervisor eliminates all non-determinism. This approach requires
than was requested by the application. To trigger a dangling pointer
hardware support or code rewriting, while DieHard’s voter is less
error, it uses the log to invoke free on an object before it is ac-
general but lighter weight.
tually freed by the application, and ignores the subsequent (actual)
Memory management approaches: Typical runtime systems
call to free this object. The fault injector only inserts dangling
sacrific robustness in favor of providing fast allocation with low
pointer errors for small object requests (< 16K).
fragmentation. Most implementations of malloc are susceptible
We verified DieHard’s resilience by injecting errors in the
to both double frees and heap corruption caused by buffer over-
espresso benchmark, and running it ten times with the default
flows. However, some recent memory managers detect heap cor-
allocator and with DieHard. We first introduced dangling pointers
ruption, including version 2.8 of the Lea allocator [25, 33], while
of frequency of 50% with distance 10: one out of every two ob-
others (Rockall [4], dnmalloc [43]) fully segregate metadata from
jects is freed ten allocations too early. This high error rate prevents
the heap like DieHard, preventing heap corruption.
espresso from running to completion with the default allocator in
Garbage collection avoids dangling pointer errors but requires
all runs. However, with DieHard, espresso runs correctly in 9 out
a significant amount of space to achieve reasonable performance
of 10 runs.

-------- Page Break --------

Error GNU libc [25] BDW GC [9] CCured [27] Rx [30] Failure-oblivious [32] DieHard
heap metadata overwrites undefined undefined abort X undefined X
invalid frees undefined X X undefined undefined X
double frees undefined X X X undefined X
∗
dangling pointers undefined X X undefined undefined X
∗
buffer overflows undefined undefined abort undefined undefined X
∗
uninitialized reads undefined undefined abort undefined undefined abort
Table 1. This table compares how various systems handle memory safety errors: Xdenotes correct execution, undefined denotes an
undefined result, and abort means the program terminates abnormally. See Section 8 for a detailed explanation of each system. The
DieHard results for the last three errors (marked with asterisks) are probabilistic; see Section 6 for exact formulae.

(3X-5X more than malloc/free) [20, 38, 44]. DieHard ignores  hibitive runtime overheads (2-25X) and space costs (around 10X)
double and invalid frees and segregates metadata from the heap to  and are thus only suitable during testing. SWAT [19] uses sampling
avoid overwrites, but unlike the Boehm-Demers-Weiser collector,  to detect memory leaks at runtime with little overhead (around 5%),
its avoidance of dangling pointers is probabilistic rather than ab-  and could be employed in conjunction with DieHard.
solute. Unlike previous memory managers, DieHard provides pro-
tection of heap data (not just metadata) from buffer overflows, and
9. Conclusion
can detect uninitialized reads.
Security vulnerabilities: Previous efforts to reduce vulnerabil-
DieHard is a runtime system that effectively tolerates memory er-
ity to heap-based security attacks randomize the base address of the
rors and provides probabilistic memory safety. DieHard uses ran-
heap [7, 29] or randomly pad allocation requests [8]. Base address
domized allocation to give the application an approximation of an
randomization provides little protection from heap-based attacks on
infinite-sized heap, and uses replication to further increase error tol-
32-bit platforms [36]. Although protection from security vulnera-
erance and detect uninitialized memory reads that propagate to pro-
bilities is not its intended goal, DieHard makes it difficult for an
gram output. DieHard allows an explicit trade-off between mem-
attacker to predict the layout or adjacency of objects in any replica.
ory usage and error tolerance, and is useful for programs in which
Failure masking: Several researchers have proposed unsound
memory footprint is less important that reliability and security. We
techniques that can prevent programs from crashing [13, 30, 32].
show that on Linux DieHard, adds little CPU overhead to many of
Automatic pool allocation segregates objects into pools of the same
the SPECint2000 benchmark programs, while the CPU overhead in
type, thus ensuring that dangling pointers are always overwrit-
allocation-intensive programs is larger. On Windows, the overhead
ten only by objects of the same type [13]. While this approach
of DieHard is reduced, and programs with DieHard occasionally
yields type safety, the resulting program behavior is unpredictable.
run faster than when running with the default allocator.
Failure-oblivious systems continue running programs by ignoring
We show analytically that DieHard increases error tolerance,
illegal writes and manufacturing values for reads of uninitialized ar-
and reaffirm our analytic results by demonstrating that DieHard sig-
eas [32]. These actions impose as high as 8X performance overhead
nificantly increases the error tolerance of an application in which
and can lead to incorrect program execution. Rx uses checkpoint-
faults are artifically injected. We also describe an experiment in
ing and logging in conjunction with a versioning file system to re-
which DieHard successfully tolerates a known buffer-overflow er-
cover from detectable errors, such as crashes. After a crash, Rx rolls
ror in the Squid web cache server.
back the application and restarts with an allocator that selectively
The DieHard runtime system tolerates heap errors but does not
ignores double frees, zero-fills buffers, pads object requests, and
prevent safety errors based on stack corruption. We believe that
defers frees [30]. Because Rx relies on checkpointing and rollback-
with compiler support, the ideas proven successful in DieHard
based recovery, it is not suitable for applications whose effects can-
could be used to improve error tolerance on the stack and also in
not be rolled back. It is also unsound: Rx cannot detect latent errors
object field references. We plan to investigate the effectiveness of
that lead to incorrect program execution rather than crashes.
this approach in future work.
Fail-stop approaches: A number of approaches that attempt
The current implementation of DieHard has limitations that we
to provide type and memory safety for C (or C-like) programs
believe can be overcome. The DieHard algorithm as implemented
are fail-stop, aborting program execution upon detecting an er-
initializes the heap based on the maximum size the heap will even-
ror [1, 3, 27, 41, 42]. We discuss two representative examples:
tually grow to. We plan to investigate an adaptive version of Die-
Cyclone and CCured. Cyclone augments C with an advanced type
Hard that grows memory regions dynamically as objects are allo-
system that allows programmers direct but safe control over mem-
cated. Other ways of reducing the memory requirements of Die-
ory [21]. CCured instruments code with runtime checks that dy-
Hard include selectively applying the technique to particular size
namically ensure memory safety and uses static analysis to remove
classes, allocation pools, object types, and/or object instances.
checks from places where memory errors cannot occur [27]. While
One limitation of the replicated form of DieHard is its inabil-
Cyclone uses region-based memory management and safe explicit
ity to work with programs that generate non-deterministic output
deallocation [16, 38], CCured relies on the BDW garbage collec-
or output related to environmental factors (e.g., time-of-day, per-
tor to protect against double frees and dangling pointers. Unlike
formance counters, interactive events, etc.) In the future, we hope
DieHard, which works with binaries and supports any language
to better characterize program output so that these kinds of irrepro-
using explicit allocation, both Cyclone and CCured operate on an
ducible results can be recognized and factored.
extended version of C source code that typically requires manual
Beyond error tolerance, DieHard also can be used to debug
programmer intervention. Both abort program execution when de-
memory corruption. By differencing the heaps of correct and in-
tecting buffer overflows or other errors, while DieHard can often
correct executions of applications, it may be possible to pinpoint
avoid them.
the exact locations of memory errors and report these as part of a
Debugging and testing: Tools like Purify [18] and Valgrind [28]
crash dump without the crash.
use binary rewriting or emulation to dynamically detect memory
Improving the security and reliability of programs written in C
errors in unaltered programs. However, these often impose pro-
and C++ is recognized by the research community as an important

-------- Page Break --------

priority and many approaches have been suggested. In this paper,   [11] T. M. Chilimbi, M. D. Hill, and J. R. Larus. Cache-conscious structure
layout. In Proceedings of SIGPLAN’99 Conference on Programming
we present a unique and effective approach to soundly tolerating
Languages Design and Implementation, ACM SIGPLAN Notices,
memory errors in unsafe programs without requiring the programs
pages 1–12, Atlanta, May 1999. ACM Press.
be rewritten or even recompiled. Like garbage collection, DieHard
represents a new and interesting alternative in the broad design
[12] D. L. Detlefs. Empirical evidence for using garbage collection in C
and C++ programs. In E. Moss, P. R. Wilson, and B. Zorn, editors,
space that trades off CPU performance, memory utilization, and
OOPSLA/ECOOP ’93 Workshop on Garbage Collection in Object-
program correctness.
Oriented Systems, Oct. 1993.
[13] D. Dhurjati, S. Kowshik, V. Adve, and C. Lattner. Memory safety
Acknowledgments
without runtime checks or garbage collection. In ACM SIGPLAN
The authors would like to thank Mike Barnett, Mike Bond, Mark
2003 Conference on Languages, Compilers, and Tools for Embedded
Corner, Trishul Chilimbi, Mike Hicks, Daniel Jim´enez, David
Systems (LCTES’2003), San Diego, CA, June 2003. ACM Press.
Jensen, Scott Kaplan, Brian Levine, Andrew McCallum, David
[14] Y. Feng and E. D. Berger. A locality-improving dynamic memory
Notkin, and Gene Novark for their helpful comments. Thanks also
allocator. In Proceedings of the ACM SIGPLAN 2005 Workshop on
to Shan Lu and Yuanyuan Zhou for providing us the buggy inputs
Memory System Performance (MSP), Chicago, IL, June 2005.
for Squid.
[15] M. J. Fischer, N. A. Lynch, and M. S. Paterson. Impossibility of
This material is based upon work supported by the National
distributed consensus with one faulty process. J. ACM, 32(2):374–
Science Foundation under CAREER Award CNS-0347339. Any
382, 1985.
opinions, findings, and conclusions or recommendations expressed
[16] D. Grossman, G. Morrisett, T. Jim, M. Hicks, Y. Wang, and J. Cheney.
in this material are those of the author(s) and do not necessarily
Region-based memory management in Cyclone. In PLDI ’02:
reflect the views of the National Science Foundation.
Proceedings of the ACM SIGPLAN 2002 Conference on Programming
∼
DieHard is publicly available at http://www.cs.umass.edu/
emery/
language design and implementation, pages 282–293, New York, NY,
diehard/.
USA, 2002. ACM Press.
[17] D. Grunwald, B. Zorn, and R. Henderson. Improving the cache local-
References
ity of memory allocation. In Proceedings of SIGPLAN’93 Conference
on Programming Languages Design and Implementation, volume
[1] T. M. Austin, S. E. Breach, and G. S. Sohi. Efficient detection of
28(6) of ACM SIGPLAN Notices, pages 177–186, Albuquerque, NM,
all pointer and array access errors. In PLDI ’94: Proceedings of the
June 1993. ACM Press.
ACM SIGPLAN 1994 conference on Programming language design
and implementation, pages 290–301, New York, NY, USA, 1994.
[18] R. Hastings and B. Joyce. Purify: Fast detection of memory leaks and
ACM Press.
access errors. In Proc. of the Winter 1992 USENIX Conference, pages
125–138, San Francisco, California, 1991.
[2] A. Avizienis. The N-version approach to fault-tolerant systems.
IEEE Transactions on Software Engineering, 11(12):1491–1501,
[19] M. Hauswirth and T. M. Chilimbi. Low-overhead memory leak
Dec. 1985.
detection using adaptive statistical profiling. In ASPLOS-XI:
Proceedings of the 11th International Conference on Architectural
[3] D. Avots, M. Dalton, V. B. Livshits, and M. S. Lam. Improving
Support for Programming Languages and Operating Systems, pages
software security with a C pointer analysis. In ICSE ’05: Proceedings
156–164, New York, NY, USA, 2004. ACM Press.
of the 27th international conference on Software engineering, pages
332–341, New York, NY, USA, 2005. ACM Press.
[20] M. Hertz and E. D. Berger. Quantifying the performance of garbage
collection vs. explicit memory management. In Proceedings of
[4] T. Ball, S. Chaki, and S. K. Rajamani. Parameterized verification
the 20th annual ACM SIGPLAN Conference on Object-Oriented
of multithreaded software libraries. In 7th International Conference
Programming Systems, Languages, and Applications, San Diego,
on Proceedings of Tools and Algorithms for the Construction and
CA, Oct. 2005.
Analysis of Systems (TACAS), volume 2031 of Lecture Notes in
Computer Science, pages 158–173, 2001.
[21] T. Jim, J. G. Morrisett, D. Grossman, M. W. Hicks, J. Cheney, and
Y. Wang. Cyclone: A safe dialect of C. In Proceedings of the General
[5] E. D. Berger, K. S. McKinley, R. D. Blumofe, and P. R. Wilson.
Track: 2002 USENIX Annual Technical Conference, pages 275–288,
Hoard: A scalable memory allocator for multithreaded applications.
Berkeley, CA, USA, 2002. USENIX Association.
In ASPLOS-IX: Ninth International Conference on Architectural
Support for Programming Languages and Operating Systems, pages
[22] M. S. Johnstone and P. R. Wilson. The memory fragmentation
117–128, Cambridge, MA, Nov. 2000.
problem: Solved? In P. Dickman and P. R. Wilson, editors, OOPSLA
’97 Workshop on Garbage Collection and Memory Management, Oct.
[6] E. D. Berger, B. G. Zorn, and K. S. McKinley. Composing high-
1997.
performance memory allocators. In Proceedings of the 2001 ACM
SIGPLAN Conference on Programming Language Design and
[23] M. Kaempf. Vudo malloc tricks. Phrack Magazine, 57(8), Aug. 2001.
Implementation (PLDI), Snowbird, Utah, June 2001.
[24] P.-H. Kamp. Malloc(3) revisited. http://phk.freebsd.dk/pubs/malloc.
[7] S. Bhatkar, D. C. DuVarney, and R. Sekar. Address obfuscation:
pdf.
An efficient approach to combat a broad range of memory error
[25] D. Lea. A memory allocator. http://gee.cs.oswego.edu/dl/html/malloc.html,
exploits. In Proceedings of the 12th USENIX Security Symposium,
1997.
pages 105–120. USENIX, Aug. 2003.
[26] G. Marsaglia. yet another RNG. posted to the electronic bulletin
[8] S. Bhatkar, R. Sekar, and D. C. DuVarney. Efficient techniques
board sci.stat.math, Aug. 1994.
for comprehensive protection from memory error exploits. In
Proceedings of the 14th USENIX Security Symposium, pages 271–
[27] G. C. Necula, S. McPeak, and W. Weimer. Ccured: type-safe
286. USENIX, Aug. 2005.
retrofitting of legacy code. In POPL ’02: Proceedings of the 29th
ACM SIGPLAN-SIGACT symposium on Principles of programming
[9] H.-J. Boehm and M. Weiser. Garbage collection in an uncooperative
languages, pages 128–139, New York, NY, USA, 2002. ACM Press.
environment. Software Practice and Experience, 18(9):807–820,
1988.
[28] N. Nethercote and J. Fitzhardinge. Bounds-checking entire programs
without recompiling. In SPACE 2004, Venice, Italy, Jan. 2004.
[10] T. C. Bressoud and F. B. Schneider. Hypervisor-based fault tolerance.
In SOSP ’95: Proceedings of the fifteenth ACM symposium on
[29] PaX Team. PaX address space layout randomization (ASLR).
Operating systems principles, pages 1–11, New York, NY, USA,
http://pax.grsecurity.net/docs/aslr.txt.
1995. ACM Press.

-------- Page Break --------

[30] F. Qin, J. Tucek, J. Sundaresan, and Y. Zhou. Rx: Treating bugs as   [38] N. Swamy, M. Hicks, G. Morrisett, D. Grossman, and T. Jim.
allergies: A safe method to survive software failures. In Proceedings     Experience with safe manual memory management in Cyclone.
of the Twentieth Symposium on Operating Systems Principles,      Science of Computer Programming, 2006. Special issue on memory
volume XX of Operating Systems Review, Brighton, UK, Oct. 2005.     management. Expands ISMM conference paper of the same name. To
ACM.                              appear.
[31] M. Rinard, C. Cadar, D. Dumitran, D. M. Roy, and T. Leu. A dynamic   [39] US-CERT. US-CERT vulnerability notes. http://www.kb.cert.org/
technique for eliminating buffer overflow vulnerabilities (and other     vuls/.
memory errors). In Proceedings of the 2004 Annual Computer
[40] P. R. Wilson, M. S. Johnstone, M. Neely, and D. Boles. Dynamic
Security Applications Conference, Dec. 2004.
storage allocation: A survey and critical review. In Proceedings of
[32] M. Rinard, C. Cadar, D. Dumitran, D. M. Roy, T. Leu, and J. William     the International Workshop on Memory Management, volume 986 of
S. Beebee. Enhancing server availability and security through failure-     Lecture Notes in Computer Science, pages 1–116, Kinross, Scotland,
oblivious computing. In Sixth Symposium on Operating Systems      Sept. 1995. Springer-Verlag.
Design and Implementation, San Francisco, CA, Dec. 2004. USENIX.
[41] W. Xu, D. C. DuVarney, and R. Sekar. An efficient and backwards-
[33] W. Robertson, C. Kruegel, D. Mutz, and F. Valeur. Run-time detection     compatible transformation to ensure memory safety of C programs.
of heap-based overflows. In LISA ’03: Proceedings of the 17th      In SIGSOFT ’04/FSE-12: Proceedings of the 12th ACM SIGSOFT
Large Installation Systems Administration Conference, pages 51–60.     twelfth international symposium on Foundations of software engi-
USENIX, 2003.                          neering, pages 117–126, New York, NY, USA, 2004. ACM Press.
[34] J. M. Robson. Bounds for some functions concerning dynamic    [42] S. H. Yong and S. Horwitz. Protecting C programs from attacks via
storage allocation. Journal of the ACM, 21(3):419–499, July 1974.      invalid pointer dereferences. In ESEC/FSE-11: 11th ACM SIGSOFT
International Symposium on Foundations of Software Engineering,
[35] J. Seward and N. Nethercote. Using Valgrind to detect undefined
pages 307–316, New York, NY, USA, 2003. ACM Press.
value errors with bit-precision. In Proceedings of the USENIX’05
Annual Technical Conference, Anaheim, California, USA, Apr. 2005.
[43] Y. Younan, W. Joosen, F. Piessens, and H. V. den Eynden. Security
of memory allocators for C and C++. Technical Report CW 419,
[36] H. Shacham, M. Page, B. Pfaff, E.-J. Goh, N. Modadugu, and
Department of Computer Science, Katholieke Universiteit Leuven,
D. Boneh. On the effectiveness of address-space randomization.
Belgium, July 2005. Available at http://www.cs.kuleuven.ac.be/
In CCS ’04: Proceedings of the 11th ACM conference on Computer
publicaties/rapporten/cw/CW419.pdf.
and Communications Security, pages 298–307, New York, NY, USA,
[44] B. Zorn. The measured cost of conservative garbage collection.
2004. ACM Press.
Software Practice and Experience, 23:733–756, 1993.
[37] Standard Performance Evaluation Corporation. SPEC2000.
http://www.spec.org.
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

-   tokens: 15843
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
          "text": "DOCS:\n```pdf file=\"src/bztest/diehard.pdf\"\nUniversity of Massachusetts Amherst\nScholarWorks@UMass Amherst\nComputer Science Department Faculty Publication\nComputer Science\nSeries\n\n2006\n\nDieHard: Probabilistic Memory Safety for Unsafe\nLanguages\nEmery D. Berger\nUniversity of Massachusetts Amherst\n\nFollow this and additional works at: https://scholarworks.umass.edu/cs_faculty_pubs\nPart of the Computer Sciences Commons\n\nRecommended Citation\nBerger, Emery D., \"DieHard: Probabilistic Memory Safety for Unsafe Languages\" (2006). Computer Science Department Faculty\nPublication Series. 87.\nRetrieved from https://scholarworks.umass.edu/cs_faculty_pubs/87\n\nThis Article is brought to you for free and open access by the Computer Science at ScholarWorks@UMass Amherst. It has been accepted for inclusion\nin Computer Science Department Faculty Publication Series by an authorized administrator of ScholarWorks@UMass Amherst. For more information,\nplease contact scholarworks@library.umass.edu.\n\n-------- Page Break --------\n\nDieHard: Probabilistic Memory Safety for Unsafe Languages\nEmery D. Berger              Benjamin G. Zorn\nDept. of Computer Science                 Microsoft Research\nUniversity of Massachusetts Amherst               One Microsoft Way\nAmherst, MA 01003                  Redmond, WA 98052\nemery@cs.umass.edu                 zorn@microsoft.com\n\nAbstract                        Dangling pointers: If the program mistakenly frees a live object,\nthe allocator may overwrite its contents with a new object or\nApplications written in unsafe languages like C and C++ are vul-\nheap metadata.\nnerable to memory errors such as buffer overflows, dangling point-\ners, and reads of uninitialized data. Such errors can lead to pro-  Buffer overflows: Out-of-bound writes can corrupt the contents of\ngram crashes, security vulnerabilities, and unpredictable behavior.    live objects on the heap.\nWe present DieHard, a runtime system that tolerates these errors\nHeap metadata overwrites: If heap metadata is stored near heap\nwhile probabilistically maintaining soundness. DieHard uses ran-\nobjects, an out-of-bound write can corrupt it.\ndomization and replication to achieve probabilistic memory safety\nUninitialized reads: Reading values from newly-allocated or un-\nby approximating an infinite-sized heap. DieHard’s memory man-\nallocated memory leads to undefined behavior.\nager randomizes the location of objects in a heap that is at least\ntwice as large as required. This algorithm prevents heap corruption\nInvalid frees: Passing illegal addresses to free can corrupt the\nand provides a probabilistic guarantee of avoiding memory errors.\nheap or lead to undefined behavior.\nFor additional safety, DieHard can operate in a replicated mode\nDouble frees: Repeated calls to free of objects that have already\nwhere multiple replicas of the same application are run simulta-\nbeen freed cause freelist-based allocators to fail.\nneously. By initializing each replica with a different random seed\nand requiring agreement on output, the replicated version of Die-\nTools like Purify [18] and Valgrind [28, 35] allow programmers to\nHard increases the likelihood of correct execution because errors\npinpoint the exact location of these memory errors (at the cost of a\nare unlikely to have the same effect across all replicas. We present\n2-25X performance penalty), but only reveal those bugs found dur-\nanalytical and experimental results that show DieHard’s resilience\ning testing. Deployed programs thus remain vulnerable to crashes\nto a wide range of memory errors, including a heap-based buffer\nor attack. Conservative garbage collectors can, at the cost of in-\noverflow in an actual application.\ncreased runtime and additional memory [12, 20], disable calls to\nfree and eliminate three of the above errors (invalid frees, double\nCategories and Subject Descriptors D.3.3 [Programming Lan-\nfrees, and dangling pointers). Assuming source code is available, a\nguages]: Dynamic storage management; D.2.0 [Software Engi-\nprogrammer can also compile the code with a safe C compiler that\nneering]: Protection mechanisms; G.3 [Probability and Statis-\ninserts dynamic checks for the remaining errors, further increasing\ntics]: Probabilistic algorithms\nrunning time [1, 3, 27, 41, 42]. As soon as an error is detected, the\ninserted code aborts the program.\nGeneral Terms Algorithms, Languages, Reliability\nWhile this fail-stop approach is safe, aborting a computation is\noften undesirable — users are rarely happy to see their programs\nKeywords DieHard, probabilistic memory safety, randomization,\nsuddenly stop. Some systems instead sacrifice soundness in order\nreplication, dynamic memory allocation\nto prolong execution in the face of memory errors [30, 32]. For\nexample, failure-oblivious computing builds on a safe C compiler\nbut drops illegal writes and manufactures values for invalid reads.\n1. Introduction\nUnfortunately, these systems provide no assurance to programmers\nWhile the use of safe languages is growing, many software ap-\nthat their programs are executing correctly.\nplications are still written in C and C++, two unsafe languages.\nThis paper makes the following contributions:\nThese languages let programmers maximize performance but are\nerror-prone. Memory management errors, which dominate recent\n1. It introduces the notion of probabilistic memory safety, a\nsecurity vulnerabilities reported by CERT [39], are especially per-\nprobabilistic guarantee of avoiding memory errors.\nnicious. These errors fall into the following categories:\n2. It presents DieHard, a runtime system that provides probabilis-\ntic memory safety. We show analytically and empirically that\nDieHard eliminates or avoids all of the memory errors described\nabove with high probability.\nPermission to make digital or hard copies of all or part of this work for personal or\nclassroom use is granted without fee provided that copies are not made or distributed\nfor profit or commercial advantage and that copies bear this notice and the full citation\n2. Overview\non the first page. To copy otherwise, to republish, to post on servers or to redistribute\nDieHard provides two modes of operation: a stand-alone mode\nto lists, requires prior specific permission and/or a fee.\nthat replaces the default memory manager, and a replicated mode\nPLDI’06 June 11–14, 2006, Ottawa, Ontario, Canada.\nCopyright c© 2006 ACM 1-59593-320-4/06/0006. . . $5.00.\nthat runs several replicas simultaneously. Both rely on a novel\n\n-------- Page Break --------\n\nrandomized memory manager that allows the computation of the  2.1 Outline\nexact probabilities of detecting or avoiding memory errors.\nThe rest of this paper is organized as follows. Section 3 formal-\nThe DieHard memory manager places objects randomly across\nizes the notions of probabilistic memory safety and infinite-heap\na heap whose size is a multiple of the maximum required (Figure 1\nsemantics, which probabilistic memory safety approximates. Sec-\nshows an example heap layout). The resulting spacing between ob-\ntion 4 then presents DieHard’s fast, randomized memory allocator\njects makes it likely that buffer overflows end up overwriting only\nthat forms the heart of the stand-alone and replicated versions. Sec-\nempty space. Randomized allocation also makes it unlikely that a\ntion 5 describes DieHard’s replicated variant. Section 6 presents\nnewly-freed object will soon be overwritten by a subsequent allo-\nanalytical results for both versions, and Section 7 provides empiri-\ncation, thus avoiding dangling pointer errors. It also improves app-\ncal results, measuring overhead and demonstrating DieHard’s abil-\nlication robustness by segregating all heap metadata from the heap\nity to avoid memory errors. Sections 8 discusses related work, and\n(avoiding most heap metadata overwrites) and ignoring attempts to\nSection 9 concludes with a discussion of future directions.\nfree already-freed or invalid objects. Despite its degradation of\nspatial locality, we show that the DieHard memory manager’s im-\n3. Probabilistic Memory Safety\npact on performance is small for many applications (average 8%\nacross the SPECint2000 benchmark suite), and actually improves\nFor the purposes of this paper, we define a program as being fully\nthe performance of some applications when running on Windows\nmemory safe if it satisifies the following criteria: it never reads\nXP.\nuninitialized memory, performs no illegal operations on the heap\nWhile the stand-alone version of DieHard provides substantial\n(no invalid/double frees), and does not access freed memory (no\nprotection against memory errors, the replicated version both in-\ndangling pointer errors).\ncreases the protection and detects errors caused by illegal reads. In\nBy aborting a computation that might violate one of these con-\nthis mode of operation, DieHard executes multiple replicas of the\nditions, a safe C compiler provides full memory safety. However,\nsame program simultaneously, each with different seeds to their\nwe would ideally like an execution environment that would allow\nrespective randomized allocators. Errors like buffer overflows are\nsuch programs to continue to execute correctly (soundly) in the face\nthus likely to overwrite different areas of memory in the different\nof these errors.\nreplicas. DieHard intercepts output from all of the various replicas\nWe can define such an idealized, but unrealizable, runtime sys-\nand compares the contents of each before transmitting any output.\ntem. We call this runtime system an infinite-heap memory man-\nWith high probability, whenever any two programs agree on their\nager, and say that it provides infinite-heap semantics. In such a\noutput, they executed safely. In other words, in any agreeing repli-\nsystem, the heap area is infinitely large, so there is no risk of heap\ncas, any buffer overflows only overwrote dead data, and dangling\nexhaustion. Objects are never deallocated, and all objects are al-\npointers were never overwritten. If an application’s output depends\nlocated infinitely far apart from each other (that is, they can be\non uninitialized data, these data will be different across the replicas,\nthought of as boundless memory blocks [31]).\nand thus DieHard will detect them.\nFrom the standpoint of a correct C execution, a program that\nSince replacing the heap with DieHard significantly improves\ndoes not deliberately seek to exhaust the heap cannot tell whether\nreliability, we believe that it is suitable for broad deployment, es-\nit is running with an ordinary heap implementation or an infinite\npecially in scenarios where increased reliability is worth the space\nheap. However, infinite-heap semantics allows programs to execute\ncost. For example, a buggy version of the Squid web caching server\nsafely that would be rejected by a safe C compiler. Because every\ncrashes on ill-formed inputs when linked with both the default\nobject is infinitely far from every other object, heap buffer over-\nGNU libc allocator and the Boehm-Demers-Weiser garbage collec-\nflows are benign — they never overwrite live data. The problems\ntor, but runs correctly with DieHard. Using additional replicas can\nof heap corruption and dangling pointers also vanish because frees\nfurther increase reliability. While additional replicas would natu-\nare ignored and allocated objects are never overwritten. However,\nrally increase execution time on uniprocessor platforms, we believe\nuninitialized reads to the heap remain undefined. Unlike Java, the\nthat the natural setting for using replication is on systems with mul-\ncontents of newly-allocated C and C++ objects are not necessarily\n1\ntiple processors. It has proven difficult to rewrite applications to\ndefined.\ntake advantage of multiple CPUs in order to make them run faster.\nDieHard can instead use the multiple cores on newer processors to\n3.1 Approximating infinite heaps\nmake legacy programs more reliable.\nWhile an infinite-heap memory manager is unimplementable, we\ncan probabilistically approximate its behavior. We replace the in-\nfinite heap with one that is M times larger than the maximum re-\nquired to obtain an M-approximation to infinite-heap semantics. By\nplacing objects uniformly at random across the heap, we get a min-\nimum expected separation of E[minimum separation] = M − 1 ob-\nL = max live size ≤ H/2 F = free = H-L\njects, making overflows smaller than M − 1 objects benign. Finally,\nby randomizing the choice of freed objects to reclaim, recently-\nfreed objects are highly unlikely to be overwritten.\n…\nreplica 1\n2 3 1\ni                    i+1\n3.2 Detecting uninitialized reads\nobject size = 2      object size = 2\nThis memory manager approximates most aspects of infinite-heap\nH = max heap size, class i\nsemantics as M approaches infinity. However, it does not quite cap-\nture infinite-heap semantics, because it does not detect uninitialized\nreads. In order to detect these, we require that the infinite heap and\n…\nreplica 2\n1 3 2\nevery allocated object be filled with random values. We can then\ndetect uninitialized reads by simultaneously executing at least two\nFigure 1. DieHard’s heap layout. The heap is divided into separate\nreplicas with different randomized allocators and comparing their\nregions, within which objects are laid out randomly. Notice the\n1\ndifferent layouts across replicas.\nISO C++ Standard 5.3.4, paragraph 14A.\n\n-------- Page Break --------\n\noutputs. An uninitialized read will return different results across the\n1 void DieHardInitHeap (int MaxHeapSize) {\nreplicas, and if this read affects the computation, the outputs of the\n2 // Initialize the random number generator\nreplicas will differ.\n3 // with a truly random number.\n4 rng.setSeed (realRandomSource);\n5 // Clear counters and allocation bitmaps\n4. Randomized Memory Management\n6 // for each size class.\nThis section describes the randomized memory management algo-\n7 for (c = 0; c < NumClasses; c++) {\nrithm that approximates the infinite heap semantics given above.\n8 inUse[c] = 0;\nWe first describe the algorithm’s initialization phase, and then\n9 isAllocated[c].clear();\ndescribe the allocation and deallocation algorithms. For pur-\n10 }\nposes of exposition, we refer to these as DieHardMalloc and\n11 // Get the heap memory.\nDieHardFree, but in the actual implementation, these are sim-\n12 heap = mmap (NULL, MaxHeapSize);\nply called malloc and free. We use interposition to replace the\n13 // REPLICATED: fill with random values\ncalls in the target application; see Section 5.1 for details.\n14 for (i = 0; i < MaxHeapSize; i += 4)\n15 ((long\n*) heap)[i] = rng.next();\n4.1 Initialization\n16 }\nThe initialization step first obtains free memory from the system\nusing mmap. The heap size is a parameter to the allocator, corre-\n1 void DieHardMalloc (size_t sz) {\n*\nsponding to the M factor described above. For the replicated ver-\n2 if (sz > MaxObjectSize)\nsion only, DieHard then uses its random number generator to fill\n3 return allocateLargeObject(sz);\nthe heap with random values. Each replica’s random number gen-\n4 c = sizeClass (sz);\nerator is seeded with a true random number. For example, the Linux\n5 if (inUse[c] == PartitionSize / (M *sz))\n\n\nversion reads from /dev/urandom, a source of true randomness.\n6 // At threshold: no more memory.\nThe random number generator is an inlined version of Marsaglia’s\n7 return NULL;\nmultiply-with-carry random number generation algorithm, which\n8 // Probe for a free slot.\nis a fast, high-quality source of pseudo-random numbers [26].\n9 do {\nThe heap is logically partitioned into twelve regions, one for\n10 index = rng.next() % bitmap size;\neach power-of-two size class from 8 bytes to 16 kilobytes. Each\n11 if (!isAllocated[c][index]) {\nregion is allowed to become at most 1/M full. DieHard allocates\n12 // Found one.\nlarger objects directly using mmap and places guard pages without\n13 // Pick pointer corresponding to slot.\nread or write access on either end of these regions. Object requests\n14 ptr = PartitionStart + index * sz;\nare rounded up to the nearest power of two. Using powers of two\n15 // Mark it allocated.\nsignificantly speeds allocation by allowing expensive division and\n16 inUse[c]++;\nmodulus operations to be replaced with bit-shifting. This organi-\n17 isAllocated[c][index] = true;\nzation also allows DieHard to efficiently prevent heap overflows\n18 // REPLICATED: fill with random values.\ncaused by unsafe library functions like strcpy, as we describe in\n19 for (i = 0; i < getSize(c); i += 4)\nSection 4.4.\n20 ((long\n*) ptr)[i] = rng.next();\nSeparate regions are crucial to making the allocation algorithm\n21 return ptr;\npractical. If instead objects were randomly spread across the en-\n22 }\ntire heap area, significant fragmentation would be a certainty, be-\n23 } while (true);\ncause small objects would be scattered across all of the pages. Re-\n24 }\nstricting each size class to its own region eliminates this external\nfragmentation. We discuss DieHard’s memory efficiency further in\nSection 4.5.\n1 void DieHardFree (void ptr) {\n*\nAnother vital aspect of the algorithm is its complete separation\n2 if (ptr is not in the heap area)\nof heap metadata from heap objects. Many allocators, including\n3 freeLargeObject(ptr);\nthe Lea allocator that forms the basis of the GNU libc allocator,\n4 c = partition ptr is in;\nstore heap metadata in areas immediately adjacent to allocated ob-\n5 index = slot corresponding to ptr;\njects (“boundary tags”). A buffer overflow of just one byte past an\n6 // Free only if currently allocated;\nallocated space can corrupt the heap, leading to program crashes,\n7 if (offset correct &&\nunpredictable behavior, or security vulnerabilities [23]. Other allo-\n8 isAllocated[c][index]) {\ncators place such metadata at the beginning of a page, reducing but\n9 // Mark it free.\nnot eliminating the likelihood of corruption. Keeping all of the heap\n10 inUse[c]--;\nmetadata separate from the heap protects it from buffer overflows.\n11 isAllocated[c][index] = false;\nThe heap metadata includes a bitmap for each heap region,\n12 } // else, ignore\nwhere one bit always stands for one object. All bits are initially\n13 }\nzero, indicating that every object is free. Additionally, DieHard\ntracks the number of objects allocated to each region (inUse); this\nFigure 2. Pseudocode for DieHard heap initialization, object allo-\nnumber is used to ensure that the number of objects does not exceed\ncation and deallocation routines.\nthe threshold factor of 1/M in the partition.\n\n4.2 Object Allocation\nWhen an application requests memory from DieHardMalloc,\nto satisfy the request, which uses mmap and stores the address\nthe allocator first checks to see whether the request is for a large\nin a table for validity checking by DieHardFree. Otherwise, it\nobject (larger than 16K); if so, it uses allocateLargeObject\nconverts the size request into a size class (dloge of the request,\n2\n\n-------- Page Break --------\n\nminus 3). As long as the corresponding region is not already full, it  Locality\nthen looks for space.\nMany allocators attempt to increase spatial locality by placing ob-\nAllocation then proceeds much like probing into a hash table.\njects that are allocated at the same time near each other in mem-\nThe allocator picks a random number and checks to see if the slot in\nory [11, 14, 25, 40]. DieHard’s random allocation algorithm instead\nthe appropriate partition is available. The fact that the heap can only\nmakes it likely that such objects will be distant. This spreading out\nbecome 1/M full bounds the expected time to search for an unused\nof objects has little impact on L1 locality because typical heap ob-\n1\nslot to\n. For example, for M = 2, the expected number of\njects are near or larger than the L1 cache line size (32 bytes on\n1−(1/M)\nprobes is two.\nthe x86). However, randomized allocation leads to a large number\nAfter finding an available slot, the allocator marks the object\nof TLB misses in one application (see Section 7.2.1), and leads to\nas allocated, increments the allocated count, and, for the replicated\nhigher resident set sizes because it can induce poor page-level lo-\nversion, fills the object with randomized values. DieHard relies on\ncality. To maintain performance, the in-use portions of the DieHard\nthis randomization to detect uninitialized reads, as we describe in\nheap should fit into physical RAM.\nSection 5.\nSpace Consumption\n4.3 Object Deallocation\nDieHard’s memory management policies tend to consume more\nmemory than conventional memory allocators. This increase in\nTo defend against erroneous programs, DieHardFree takes sev-\nmemory is caused by two factors: rounding up objects to the next\neral steps to ensure that any object given to it is in fact valid.\npower of two, and requiring that the heap be M times larger than\nFirst, it checks to see if the address to be freed is inside the\nnecessary.\nheap area, indicating it may be a large object. Because all large\nThe rounding up of objects to the next power of two can, in the\nobjects are mmaped on demand, they lie outside of the main\nworst-case, increase memory consumption by up to a factor of two.\nheap. The function freeLargeObject checks the table to en-\nWilson et al. present empirical results suggesting that this policy\nsure that this object was indeed returned by a previous call to\ncan lead to significant fragmentation [40]. Nonetheless, such an\nallocateLargeObject. If so, it munmaps the object; oth-\nallocator is used in real systems, FreeBSD’s PHKmalloc [24], and\nerwise, it ignores the request.\nis both time and space-efficient in practice [14].\nIf the address is inside the small-object heap, DieHard checks\nAny increase in memory consumption caused by rounding is\nit for validity to prevent double and invalid frees. First, the offset\nbalanced by two DieHard features that reduce memory consump-\nof the address from the start of its region (for the given size class)\ntion. First, unlike most conventional allocators including the GNU\nmust be a multiple of the object size. Second, the object must be\nlibc allocator, DieHard’s allocator has no per-object headers. These\ncurrently marked as allocated. If both of these conditions hold,\nheaders typically consume eight bytes, but DieHard’s per-object\nDieHard finally resets the bit corresponding to the object location\noverhead is just one bit in the allocation bitmap. Second, while\nin the bitmap and decrements the count of allocated objects for this\ncoarse size classes can increase internal fragmentation, DieHard’s\nregion.\nuse of segregated regions completely eliminates external frag-\nmentation. The Lea allocator’s external fragmentation plus per-\n4.4 Limiting Heap Buffer Overflows\nobject overhead increases memory consumption by approximately\n20% [14].\nWhile randomizing the heap provides probabilistic protection\nA more serious concern is the requirement of a factor of M ad-\nagainst heap buffer overflows (see Section 6.1), DieHard’s heap\nditional space for each of the twelve size classes, and the use of\nlayout makes it efficient to prevent overflows caused by unsafe\nreplicas. In the worst case, a program using DieHard could request\nlibrary functions like strcpy. DieHard replaces these unsafe li-\nobjects of just one size and so require up to 12M more memory\nbrary functions with variants that do not write beyond the allocated\nthan needed. We could reduce this overhead using profile informa-\narea of heap objects. Each function first checks if the destination\ntion to reserve only M times the maximum needed for each size\npointer lies within the heap (two comparisons). If so, it finds the\nclass. However, Robson showed that this factor (a logarithm of the\nstart of the object by bitmasking the pointer with its size (com-\nratio of the largest size to the smallest) is the worst case for all\nputed with a bitshift) minus one. DieHard then computes the avail-\nmemory allocators [34]. Approaches like conservative garbage col-\nable space from the pointer to the end of the object (two subtrac-\nlection can impose an additional space overhead of 3X-5X over\ntions). With this value limiting the maximum number of bytes to\nmalloc/free [20, 44]. Finally, memory that is reserved by Die-\nbe copied, DieHard prevents strcpy from causing heap buffer\nHard but not used does not consume any virtual memory; the ac-\noverflows.\ntual implementation of DieHard lazily initializes heap partitions.\nIn addition to replacing strcpy, DieHard also replaces its\nNonetheless, DieHard’s approach reduces the available address\n“safe” counterpart, strncpy. This function requires a length ar-\nspace, which may make it unsuitable for applications with large\ngument that limits the number of bytes copied into the destina-\nheap footprints running on 32-bit systems. We expect the problem\ntion buffer. The standard C library contains a number of these\nof reduced address space will become less of an issue as 64-bit\nchecked library functions in an attempt to reduce the risk of\nprocessors become commonplace. We also believe that DieHard’s\nbuffer overflows. However, checked functions are little safer than\nspace-reliability tradeoff will be acceptable for many purposes, es-\ntheir unchecked counterparts, since programmers can inadvertently\npecially long-running applications with modest-sized heaps.\nspecify an incorrect length. As with strcpy, the DieHard version\nof strncpy checks the actual available space in the destination\nobject and uses that value as the upper bound.\n5. Replication\nWhile replacing an application’s allocator with DieHard reduces\n4.5 Discussion\nthe likelihood of memory errors, this stand-alone approach cannot\ndetect uninitialized reads. To catch these errors, and to further in-\nThe design of DieHard’s allocation algorithm departs significantly\ncrease the likelihood of correct execution, we have built a version of\nfrom previous memory allocators. In particular, it makes no effort\nDieHard (currently for UNIX platforms only) that executes several\nto improve locality and can increase space consumption.\n\n-------- Page Break --------\n\nreplicas simultaneously. Figure 3 depicts the architecture, instanti-    Any non-agreeing replicas have either exited abnormally before\nated with three replicas.                   filling their output buffers, or produced different output. Whenever\nThe diehard command takes three arguments: the path to the  a replica crashes, DieHard receives a signal and decrements the\nreplicated variant of the DieHard memory allocator (a dynamically-  number of currently-live replicas. A replica that has generated\nloadable library), the number of replicas to create, and the applica-  anomalous output is no longer useful since it has entered into\ntion name.                         an undefined state. Our current implementation kills such failed\nreplicas and decreases the currently-live replica count. To further\nimprove availability, we could replace failed replicas with a copy\n5.1 Replicas and Input\nof one of the “good” replicas with its random number generation\nDieHard spawns each replica in a separate process, each with\nseed set to a different value.\nthe LD PRELOAD environment variable pointing to the DieHard\nmemory management library libdiehard.so. This library in-\n5.3 Discussion\nterposition redirects all calls to malloc and free in the applica-\nExecuting applications simultaneously on the same system while\ntion to DieHard’s memory manager. Because the memory manager\nboth providing reasonable performance and preserving application\npicks a different random number generation seed on every invoca-\nsemantics is a challenge. We address these issues here.\ntion, all replicas execute with different sequences of random num-\nIn order to make correct replicas output-equivalent to the ex-\nbers.\ntent possible, we intercept certain system calls that could produce\nDieHard uses both pipes and shared memory to communicate\ndifferent results. In particular, we redirect functions that access the\nwith the replicas. Each replica receives its standard input from Die-\ndate and system clock so that all replicas return the same value.\nHard via a pipe. Each replica then writes its standard output into a\nWhile it may appear that voting on all output might be expen-\nmemory-mapped region shared between DieHard and the replica.\nsive, it is amortized because this processing occurs in 4K chunks.\nAfter all I/O redirection is established, each replica begins exe-\nMore importantly, voting is only triggered by I/O, which is already\ncution, receiving copies of standard input from the main DieHard\nexpensive, and does not interfere with computation.\nprocess.\nA disadvantage of the barrier synchronization employed here is\nWhile the stand-alone version of DieHard works for any pro-\nthat an erroneous replica could theoretically enter an infinite loop,\ngram, the replicated DieHard architecture is intended for programs\nwhich would cause the entire program to hang because barrier syn-\nwhose output is inherently non-deterministic. The current imple-\nchronization would never occur. There are two approaches that one\nmentation is targeted at standard UNIX-style commands that read\ncan take: use a timer to kill replicas that take too long to arrive at\nfrom standard input and write to standard output. Also, while we\nthe barrier, or ignore the problem, as we currently do. Establishing\nintend to support programs that modify the filesystem or perform\nan appropriate waiting time would solve the problem of consensus\nnetwork I/O, these are not supported by the current version of the\nin the presence of Byzantine failures, which is undecidable [15].\nreplicated system. We leave the use of DieHard replication with\ninteractive applications as future work.\n6. Analysis\n5.2 Voting\nWhile DieHard is immune to heap corruption caused by double\nfrees, invalid frees, and heap metadata overwrites caused by over-\nDieHard manages output from the replicas by periodically synchro-\nflow, its immunity to other memory errors is probabilistic. In this\nnizing at barriers. Whenever all currently-live replicas terminate or\nsection, we quantify the probabilistic memory safety provided by\nfill their output buffers (currently 4K each, the unit of transfer of\nboth the stand-alone and replicated versions of DieHard. We derive\na pipe), the voter compares the contents of each replica’s output\nequations that provide lower bounds on the likelihood of avoiding\nbuffer. If all agree, then the contents of one of the buffers are sent\nbuffer overflow and dangling pointer errors, and detecting unini-\nto standard output, and execution proceeds as normal.\ntialized reads. We assume that the heap metadata, which is placed\nHowever, if not all of the buffers agree, it means that at least one\nrandomly in memory and protected on either side by guard pages,\nof the replicas has an error. The voter then chooses an output buffer\nis not corrupted.\nagreed upon by at least two replicas and sends that to standard out.\nWe use the following notation throughout the analyses. Recall\nTwo replicas suffice, because the odds are slim that two randomized\nthat M denotes the heap expansion factor that determines how large\nreplicas with memory errors would return the same result.\nthe heap is relative to the maximum application live object size.\nWe use k for the number of replicas, H the maximum heap size,\nL the maximum live size (L ≤ H/M), and F the remaining free\nspace (H − L). Figure 1 depicts these variables graphically. When\nanalyzing buffer overflows, we use O to stand for the number of\nseed\nreplica\n1\nobjects’ worth of bytes overflowed (e.g., a 9-byte overflow could\noverwrite O = 2 8-byte objects). For dangling pointer errors, we\noutput\ninput\nuse A to denote the number of allocations that have taken place\nseed\nreplica\n2\nafter a premature call to free.\nWe make a simplifying and conservative assumption in these\nseed\nreplica\nvote\nbroadcast\nanalyses that all object requests are for a specific size class. This\n3\napproach is conservative because the separation of different size\nexecute\nclasses improves the odds of avoiding memory errors. We also\nrandomized\nassume that there is either one replica or at least three, since the\nreplicas\nvoter cannot decide which of two disagreeing replicas is the correct\none.\nFigure 3. The replicated DieHard architecture. Input is broad-\nNote that the analyses below quantify the probability of avoid-\ncast to multiple replicas, each equipped with a different, fully-\ning a single error of a given type. One can calculate the probabil-\nrandomized memory manager. Output is only committed when at\nity of avoiding multiple errors by multiplying the probabilities of\nleast two replicas agree on the result.\navoiding each error, although this computation depends on an as-\n\n-------- Page Break --------\n\nProbability of Avoiding Dangling Pointer Error\nProbability of Avoiding Buffer Overflow\n\n100 allocs 1000 allocs 10,000 allocs\n1/8 full 1/4 full 1/2 full\n\n100%\n100%\n90%\n90%\n80%\n80%\n70%\n70%\n60%\n60%\n50%\n50%\n40%\n40%\nProbability\nProbability\n30%\n30%\n20%\n20%\n10%\n10%\n0%\n0%\n1 3 4 5 6\n8 16 32 64 128 256\nReplicas\nObject size (bytes)\n(a) Probability of masking single-object buffer overflows for varying    (b) Probability of masking dangling pointer errors using the stand-alone\nreplicas and degrees of heap fullness.                  version of DieHard in its default configuration, for varying object sizes\nand intervening allocations.\n\nFigure 4. Probabilities of avoiding buffer overflows and dangling pointer errors.\n\nsumption of independence that may not hold. Also, these results  is, the call to free should have happened at some point after the\nonly hold for objects smaller than 16K in size, because larger ob-  next A calls to malloc but before the A + 1th call. Avoiding a\njects are managed separately as described in Section 4.1.      dangling pointer error is thus the likelihood that some replica has\nnot overwritten the object’s contents after A allocations:\n6.1 Masking Buffer Overflows\nTheorem 2. Let Overwrites be the number of times that a partic-\nIn this section, we derive the probability of masking buffer over-\nular freed object of size S gets overwritten by one of the next A\nflows. While buffer overflows are generally writes just beyond an\nallocations. Then the probability of this object being intact after A\nallocated object, for our analysis, we model a buffer overflow as\nallocations, assuming A ≤ F/S and k  6= 2, is:\na write to any location in the heap. If a buffer overflow does not\n)\n(\noverwrite any live data in at least one replica’s heap, we say that\nk\nA\nthe buffer overflow has been successfully masked. The following\n.\nP(Overwrites = 0) ≥ 1 −\nF/S\nformula gives the probability of successfully masking a buffer over-\nflow.\nTheorem 1. Let OverflowedObjects be the number of live objects\nProof. The prematurely freed object is indexed by one of the Q =\noverwritten by a buffer overflow. Then for k  6= 2, the probability of\nF/S bits in the allocation bitmap for its size class. The odds of a\nmasking a buffer overflow is\nnew allocation not overwriting that object are thus (Q − 1)/Q. As-\n]\n[\nk\n)\n(\nsume that after each allocation, we do not free an object, which\nO\nF\n.\nP(OverflowedObjects = 0) = 1 −1 −\nH\nis the worst case. After the second allocation, the odds are (Q −\n1)/Q ∗ (Q − 2)/(Q − 1) = (Q − 2)/Q. In general, after A alloca-\ntions, the probability of not having overwritten a particular slot is\n(Q − A)/Q.\nProof. The odds of O objects overwriting at least one live object are\nThe probability that no replica has overwritten a particular ob-\nF\nO\n1 minus the odds of them overwriting no live objects, or 1 − ( ).\nH\nject after A allocations is then one minus the odds of all of the\nMasking the buffer overflow requires that at least one of the k\nk\nreplicas overwriting that object, or 1 − (1 − (Q − A)/Q)= 1 −\nreplicas not overwrite any live objects, which is the same as 1 minus\nk\n(A/(F/S)).\nF\nOk\nall of them overwriting at least one live object = 1 − (1 − (\n)).\nH\nThis result shows that DieHard is robust against dangling\npointer errors, especially for small objects. Using the default con-\nProbabilistic memory safety provides good protection against\nfiguration, the stand-alone version of DieHard has greater than a\nmodest buffer overflows. Whenever the heap is large relative to the\n99.5% chance of masking an 8-byte object that was freed 10,000\nmaximum amount of live memory, the likelihood of masking an\nallocations too soon. Figure 4(b) shows the probabilities of avoid-\nerror increases. For example, when the heap is no more than 1/8\ning dangling pointer errors for different object sizes and numbers\nfull, DieHard in stand-alone mode provides an 87.5% chance of\nof intervening allocations.\nmasking a single-object overflow, while three replicas avoids such\n6.3 Detecting uninitialized reads\nerrors with greater than 99% probability. Figure 4(a) shows the\nprobability of protecting against overflows for different numbers\nWe say that DieHard detects an uninitialized read when it causes all\nof replicas and degrees of heap fullness.\nof the replicas to differ on their output, leading to termination. An\nuninitialized read is a use of memory obtained from an allocation\n6.2 Masking Dangling Pointers\nbefore it has been initialized. If an application relies on values read\nA dangling pointer error occurs when an object is freed prematurely  from this memory, then its behavior will eventually reflect this use.\nand its contents are overwritten by another object. Suppose that the  We assume that uninitialized memory reads are either benign or\nobject should have been freed A allocations later than it was; that  propagate to output.\n\n-------- Page Break --------\n\nThe odds of detecting such a read thus depend both on how  the replacement of unsafe library functions (see Section 4.4) for\nmuch use the application makes of the uninitialized memory, and  these experiments to isolate the protection that randomization and\nits resulting impact on the output. An application could widen the  replication provide.\nuninitialized data arbitarily, outputting the data in an infinite loop.\n7.2 Overhead\nOn the other end of the spectrum, an application might narrow the\ndata by outputting just one bit based on the contents of the entire\nWe run our benchmarks on three different platforms: Linux, Win-\nuninitialized region. For example, it could output an ‘A’ if the first\ndows XP, and Solaris. The Linux platform is a dual-processor Intel\nbit in the region was a 0, and ‘a’ if it was 1.\nXeon system with each 3.06GHz processor (hyperthreading active)\nIf we assume that the application generates just one bit of output\nequipped with 512K L2 caches and with 3 gigabytes of RAM. All\nbased on every bit in the uninitialized area of memory, we get the\ncode on Linux is compiled with g++ version 4.0.2. The Windows\nfollowing result:\nXP platform is a Pentium 4 system running at 3.20GHz with a 512K\nL2 cache and 2 gigabytes of RAM. All code on Windows is com-\nTheorem 3. The probability of detecting an uninitialized read\npiled using Visual Studio 7. The Solaris platform is a Sun SunFire\nof B bits in k replicas (k > 2) in a non-narrowing, non-widening\n6800 server, with 16 900MHz UltraSparc v9 processors and 16 gi-\ncomputation is:\ngabytes of RAM; code there is compiled with g++ 3.2. All code is\ncompiled at the highest optimization level on all platforms. Tim-\nB\n2!\nings are performed while the systems are quiescent. We report the\nP(Detect uninitialized read) = .\nB Bk\n(2− k)!2\naverage of five runs after one warm-up run; observed variances are\nbelow 1%.\n7.2.1 Linux\nProof. For DieHard to detect an uninitialized read, all replicas must\nOn Linux, we compare both DieHard and the Boehm-Demers-\ndisagree on the result stemming from the read. In other words,\nWeiser collector to the default GNU libc allocator, a variant of the\nall replicas must have filled in the uninitialized region of length\nB\nLea allocator [25]. The Boehm-Demers-Weiser collector is used\nB with a different B-bit number. There are 2numbers of length B,\nBk\nfor comparison because it represents an alternative trade-off in the\nand k replicas yields 2 possible combinations of these numbers.\nB  B\ndesign space between space, execution time, and safety guarantees.\nThere are (2)!/(2−k)! ways of selecting different B-bit numbers\nB\nFigure 5(a) shows that, for the allocation-intensive benchmarks,\nacross the replicas (assuming 2> k). We thus have a likelihood of\nDieHard suffers a performance penalty ranging from 16.5% to\nB  B Bk\ndetecting an uninitialized read of (2!)/(2− k)!2.\n63% (geometric mean: 40%). Its overhead is thus somewhat higher\nthan that suffered by the Boehm-Demers-Weiser collector (2% to\nInterestingly, in this case, replicas lower the likelihood of mem-\n59.7%, geometric mean 25.8%).\nory safety. For example, the probability of detecting an uninitial-\nHowever, DieHard’s runtime overhead is substantially lower for\nized read of four bits across three replicas is 82%, while for four\nmost of the SPECint2000 benchmarks. The geometric mean of Die-\nreplicas, it drops to 66.7%. However, this drop has little practical\nHard’s overhead is 12%. DieHard degrades performance substan-\nimpact for reads of more data. The odds of detecting an unini-\ntially for two applications: 253.perlbmk (48.8%) and 300.twolf\ntialized read of 16 bits drops from 99.995% for three replicas to\n(109%). The 253.perlbmk benchmark is allocation-intensive,\n99.99% for four replicas.\nspending around 12.5% of its execution doing memory operations,\nDieHard’s effectiveness at finding uninitialized reads makes it\nhighlighting both DieHard’s and Boehm-Demers-Weiser’s runtime\nuseful as an error-detecting tool during development. During ex-\noverhead (13.4%). However, the 300.twolf overhead is due not to\nperiments for this paper, we discovered uninitialized reads in sev-\nthe cost of allocation but to TLB misses. 300.twolf uses a wide\neral benchmarks. The replicated version of DieHard typically ter-\nrange of object sizes. In DieHard, accesses to these objects are\nminated in several seconds. We verified these uninitialized read er-\nspread over many size class partitions.\nrors with Valgrind, which ran approximately two orders of magni-\ntude slower.\n7.2.2 Windows\nTo evaluate the effect of different default allocators and compil-\n7. Experimental Results\ners on DieHard’s overhead, we ran the allocation-intensive bench-\nWe first measure the runtime impact of the DieHard memory man-\nmarks on Windows XP. Figure 5(b) presents execution time results\nager on a suite of benchmark applications. We then empirically\nfor these benchmarks.\nevaluate its effectiveness at avoiding both injected faults and actual\nThe results on Windows XP are far different than for Linux:\nbugs.\nthe geometric mean of performance for these allocation-intensive\nbenchmarks with DieHard is effectively the same as with the de-\n7.1 Benchmarks\nfault allocator. DieHard improves runtime performance for roboop\nby 19%, espresso by 8.2%, and cfrac by 6.4%. Only lindsay and\nWe evaluate DieHard’s performance with both the full SPECint2000\np2c perform slower, by 13.6% and 22.5% respectively.\nsuite [37] running reference workloads, as well as a suite of\nWe attribute these results to two factors: first, the default Win-\nallocation-intensive benchmarks. These benchmarks perform be-\ndows XP allocator is substantially slower than the Lea allocator.\ntween 100,000 and 1,700,000 memory operations per second (see\nSecond, Visual Studio produces much faster code for DieHard than\nBerger, Zorn and McKinley [6] for a detailed description). We\ng++ does. DieHard is written in modular C++ code with many\ninclude these benchmarks both because they are widely used in\nsmall methods, and Visual Studio’s better inlining heuristics and\nmemory management studies [5, 17, 22] and because their unusu-\nbackend code generator combine to substantially improve Die-\nally high allocation-intensity stresses memory management perfor-\nHard’s performance.\nmance.\nIn all of our experiments, we set the default heap size for Die-\n7.2.3 Solaris: Replicated Experiments\nHard to 384MB, where up to 1/2 is available for allocation. This\nTo quantify the overhead of the replicated framework and verify\nis larger than necessary for nearly all of the applications we mea-\nits scalability, we measure running time with sixteen replicas on a\nsure here, but ensures consistency in our results. We also disable\n\n-------- Page Break --------\n\nRuntime on Linux\nRuntime on Windows\nmalloc GC DieHard\nmalloc DieHard\n2.5\n2.5\nalloc-intensive general-purpose\n2\n2\n\n1.5\n1.5\n\n1\n1\n0.5\nNormalized runtime\n0.5\nNormalized runtime\n0\np2c\ncfrac\n175.vpr\nlindsay\n176.gcc\n181.mcf\nroboop\n0\n252.eon\n254.gap\n164.gzip\nespresso\n256.bzip2\n300.twolf\n186.crafty\n197.parser\n255.vortex\nGeo. Mean                            Geo. Mean\ncfrac espresso lindsay p2c roboop Geo. Mean\n253.perlbmk\n\n(a) Linux: Performance of the default malloc, the Boehm-Demers-    (b) Windows XP: Performance of the default malloc and DieHard\nWeiser garbage collector, and DieHard (stand-alone version), across a    (stand-alone version), across a range of allocation-intensive benchmark\nrange of allocation-intensive and general-purpose benchmark applications.    applications.\n\nFigure 5. Runtime performance on Linux and Windows XP.\n\n16-way Sun server. We ran these experiments with the allocation-   We then injected buffer overflow errors at a 1% rate (1 out of\nintensive benchmark suite, except for lindsay, which has an unini-  every 100 allocations), under-allocating object requests of 32 bytes\ntialized read error that DieHard detects and terminates. Running 16  or more by 4 bytes. With the default allocator, espresso crashes\nreplicas simultaneously increases runtime by approximately 50%  in 9 out of 10 runs and enters an infinite loop in the tenth. With\nversus running a single replica with the replicated version of the  DieHard, it runs successfully in all 10 of 10 runs.\n). Part of this cost is due to process\nruntime (libdiehard r.so\ncreation, which longer-running benchmarks would amortize. This\nReal Faults\nresult shows that while voting and interprocess communication im-\nWe also tested DieHard on an actual buggy application. Version\npose some overhead, the replicated framework scales to a large\n2.3s5 of the Squid web cache server has a buffer overflow error\nnumber of processors.\nthat can be triggered by an ill-formed input. When faced with this\ninput and running with either the GNU libc allocator or the Boehm-\n7.3 Error Avoidance\nDemers-Weiser collector, Squid crashes with a segmentation fault.\nUsing DieHard in stand-alone mode, the overflow has no effect.\nWe evaluate DieHard’s effectiveness at avoiding both artificially-\ninjected bugs and actual bugs in a real application, the Squid web\ncaching server.\n8. Related Work\nThis section describes related work in software engineering, fault\n7.3.1 Fault Injection\ntolerance, memory management, approaches to address security\nWe implement two libraries that inject memory errors into unal-  vulnerabilities, failure masking, fail-stop, debugging and testing.\ntered applications running on UNIX platforms to explore the re-  Table 1 summarizes how DieHard and the systems described here\nhandle memory safety errors.\nsilience of different runtime systems to memory errors including\nOur approach is inspired by N-version programming, in which\nbuffer overflows and dangling pointers.\nindependent programmers produce variants of a desired pro-\nWe first run the application with a tracing allocator that gen-\n N-version programming relies on a conjecture\ngram [2]. Whereas\nerates an allocation log. Whenever an object is freed, the library\nof independence across programmers to reduce the likelihood of\noutputs a pair, indicating when the object was allocated and when\nerrors, DieHard provides hard analytical guarantees.\nit was freed (in allocation time). We then sort the log by allocation\nFault tolerance: DieHard’s use of replicas with a voter process\ntime and use a fault-injection library that sits between the appli-\nis closely related to Bressoud and Schneider’s hypervisor-based\ncation and the memory allocator. The fault injector triggers errors\nsystem, which provides fault tolerance in the face of fail-stop exe-\nprobabilistically, based on the requested frequencies. To trigger an\ncutions [10]. In addition to supporting replication and voting, their\nunderflow, it requests less memory from the underlying allocator\nhypervisor eliminates all non-determinism. This approach requires\nthan was requested by the application. To trigger a dangling pointer\nhardware support or code rewriting, while DieHard’s voter is less\nerror, it uses the log to invoke free on an object before it is ac-\ngeneral but lighter weight.\ntually freed by the application, and ignores the subsequent (actual)\nMemory management approaches: Typical runtime systems\ncall to free this object. The fault injector only inserts dangling\nsacrific robustness in favor of providing fast allocation with low\npointer errors for small object requests (< 16K).\nfragmentation. Most implementations of malloc are susceptible\nWe verified DieHard’s resilience by injecting errors in the\nto both double frees and heap corruption caused by buffer over-\nespresso benchmark, and running it ten times with the default\nflows. However, some recent memory managers detect heap cor-\nallocator and with DieHard. We first introduced dangling pointers\nruption, including version 2.8 of the Lea allocator [25, 33], while\nof frequency of 50% with distance 10: one out of every two ob-\nothers (Rockall [4], dnmalloc [43]) fully segregate metadata from\njects is freed ten allocations too early. This high error rate prevents\nthe heap like DieHard, preventing heap corruption.\nespresso from running to completion with the default allocator in\nGarbage collection avoids dangling pointer errors but requires\nall runs. However, with DieHard, espresso runs correctly in 9 out\na significant amount of space to achieve reasonable performance\nof 10 runs.\n\n-------- Page Break --------\n\nError GNU libc [25] BDW GC [9] CCured [27] Rx [30] Failure-oblivious [32] DieHard\nheap metadata overwrites undefined undefined abort X undefined X\ninvalid frees undefined X X undefined undefined X\ndouble frees undefined X X X undefined X\n∗\ndangling pointers undefined X X undefined undefined X\n∗\nbuffer overflows undefined undefined abort undefined undefined X\n∗\nuninitialized reads undefined undefined abort undefined undefined abort\nTable 1. This table compares how various systems handle memory safety errors: Xdenotes correct execution, undefined denotes an\nundefined result, and abort means the program terminates abnormally. See Section 8 for a detailed explanation of each system. The\nDieHard results for the last three errors (marked with asterisks) are probabilistic; see Section 6 for exact formulae.\n\n(3X-5X more than malloc/free) [20, 38, 44]. DieHard ignores  hibitive runtime overheads (2-25X) and space costs (around 10X)\ndouble and invalid frees and segregates metadata from the heap to  and are thus only suitable during testing. SWAT [19] uses sampling\navoid overwrites, but unlike the Boehm-Demers-Weiser collector,  to detect memory leaks at runtime with little overhead (around 5%),\nits avoidance of dangling pointers is probabilistic rather than ab-  and could be employed in conjunction with DieHard.\nsolute. Unlike previous memory managers, DieHard provides pro-\ntection of heap data (not just metadata) from buffer overflows, and\n9. Conclusion\ncan detect uninitialized reads.\nSecurity vulnerabilities: Previous efforts to reduce vulnerabil-\nDieHard is a runtime system that effectively tolerates memory er-\nity to heap-based security attacks randomize the base address of the\nrors and provides probabilistic memory safety. DieHard uses ran-\nheap [7, 29] or randomly pad allocation requests [8]. Base address\ndomized allocation to give the application an approximation of an\nrandomization provides little protection from heap-based attacks on\ninfinite-sized heap, and uses replication to further increase error tol-\n32-bit platforms [36]. Although protection from security vulnera-\nerance and detect uninitialized memory reads that propagate to pro-\nbilities is not its intended goal, DieHard makes it difficult for an\ngram output. DieHard allows an explicit trade-off between mem-\nattacker to predict the layout or adjacency of objects in any replica.\nory usage and error tolerance, and is useful for programs in which\nFailure masking: Several researchers have proposed unsound\nmemory footprint is less important that reliability and security. We\ntechniques that can prevent programs from crashing [13, 30, 32].\nshow that on Linux DieHard, adds little CPU overhead to many of\nAutomatic pool allocation segregates objects into pools of the same\nthe SPECint2000 benchmark programs, while the CPU overhead in\ntype, thus ensuring that dangling pointers are always overwrit-\nallocation-intensive programs is larger. On Windows, the overhead\nten only by objects of the same type [13]. While this approach\nof DieHard is reduced, and programs with DieHard occasionally\nyields type safety, the resulting program behavior is unpredictable.\nrun faster than when running with the default allocator.\nFailure-oblivious systems continue running programs by ignoring\nWe show analytically that DieHard increases error tolerance,\nillegal writes and manufacturing values for reads of uninitialized ar-\nand reaffirm our analytic results by demonstrating that DieHard sig-\neas [32]. These actions impose as high as 8X performance overhead\nnificantly increases the error tolerance of an application in which\nand can lead to incorrect program execution. Rx uses checkpoint-\nfaults are artifically injected. We also describe an experiment in\ning and logging in conjunction with a versioning file system to re-\nwhich DieHard successfully tolerates a known buffer-overflow er-\ncover from detectable errors, such as crashes. After a crash, Rx rolls\nror in the Squid web cache server.\nback the application and restarts with an allocator that selectively\nThe DieHard runtime system tolerates heap errors but does not\nignores double frees, zero-fills buffers, pads object requests, and\nprevent safety errors based on stack corruption. We believe that\ndefers frees [30]. Because Rx relies on checkpointing and rollback-\nwith compiler support, the ideas proven successful in DieHard\nbased recovery, it is not suitable for applications whose effects can-\ncould be used to improve error tolerance on the stack and also in\nnot be rolled back. It is also unsound: Rx cannot detect latent errors\nobject field references. We plan to investigate the effectiveness of\nthat lead to incorrect program execution rather than crashes.\nthis approach in future work.\nFail-stop approaches: A number of approaches that attempt\nThe current implementation of DieHard has limitations that we\nto provide type and memory safety for C (or C-like) programs\nbelieve can be overcome. The DieHard algorithm as implemented\nare fail-stop, aborting program execution upon detecting an er-\ninitializes the heap based on the maximum size the heap will even-\nror [1, 3, 27, 41, 42]. We discuss two representative examples:\ntually grow to. We plan to investigate an adaptive version of Die-\nCyclone and CCured. Cyclone augments C with an advanced type\nHard that grows memory regions dynamically as objects are allo-\nsystem that allows programmers direct but safe control over mem-\ncated. Other ways of reducing the memory requirements of Die-\nory [21]. CCured instruments code with runtime checks that dy-\nHard include selectively applying the technique to particular size\nnamically ensure memory safety and uses static analysis to remove\nclasses, allocation pools, object types, and/or object instances.\nchecks from places where memory errors cannot occur [27]. While\nOne limitation of the replicated form of DieHard is its inabil-\nCyclone uses region-based memory management and safe explicit\nity to work with programs that generate non-deterministic output\ndeallocation [16, 38], CCured relies on the BDW garbage collec-\nor output related to environmental factors (e.g., time-of-day, per-\ntor to protect against double frees and dangling pointers. Unlike\nformance counters, interactive events, etc.) In the future, we hope\nDieHard, which works with binaries and supports any language\nto better characterize program output so that these kinds of irrepro-\nusing explicit allocation, both Cyclone and CCured operate on an\nducible results can be recognized and factored.\nextended version of C source code that typically requires manual\nBeyond error tolerance, DieHard also can be used to debug\nprogrammer intervention. Both abort program execution when de-\nmemory corruption. By differencing the heaps of correct and in-\ntecting buffer overflows or other errors, while DieHard can often\ncorrect executions of applications, it may be possible to pinpoint\navoid them.\nthe exact locations of memory errors and report these as part of a\nDebugging and testing: Tools like Purify [18] and Valgrind [28]\ncrash dump without the crash.\nuse binary rewriting or emulation to dynamically detect memory\nImproving the security and reliability of programs written in C\nerrors in unaltered programs. However, these often impose pro-\nand C++ is recognized by the research community as an important\n\n-------- Page Break --------\n\npriority and many approaches have been suggested. In this paper,   [11] T. M. Chilimbi, M. D. Hill, and J. R. Larus. Cache-conscious structure\nlayout. In Proceedings of SIGPLAN’99 Conference on Programming\nwe present a unique and effective approach to soundly tolerating\nLanguages Design and Implementation, ACM SIGPLAN Notices,\nmemory errors in unsafe programs without requiring the programs\npages 1–12, Atlanta, May 1999. ACM Press.\nbe rewritten or even recompiled. Like garbage collection, DieHard\nrepresents a new and interesting alternative in the broad design\n[12] D. L. Detlefs. Empirical evidence for using garbage collection in C\nand C++ programs. In E. Moss, P. R. Wilson, and B. Zorn, editors,\nspace that trades off CPU performance, memory utilization, and\nOOPSLA/ECOOP ’93 Workshop on Garbage Collection in Object-\nprogram correctness.\nOriented Systems, Oct. 1993.\n[13] D. Dhurjati, S. Kowshik, V. Adve, and C. Lattner. Memory safety\nAcknowledgments\nwithout runtime checks or garbage collection. In ACM SIGPLAN\nThe authors would like to thank Mike Barnett, Mike Bond, Mark\n2003 Conference on Languages, Compilers, and Tools for Embedded\nCorner, Trishul Chilimbi, Mike Hicks, Daniel Jim´enez, David\nSystems (LCTES’2003), San Diego, CA, June 2003. ACM Press.\nJensen, Scott Kaplan, Brian Levine, Andrew McCallum, David\n[14] Y. Feng and E. D. Berger. A locality-improving dynamic memory\nNotkin, and Gene Novark for their helpful comments. Thanks also\nallocator. In Proceedings of the ACM SIGPLAN 2005 Workshop on\nto Shan Lu and Yuanyuan Zhou for providing us the buggy inputs\nMemory System Performance (MSP), Chicago, IL, June 2005.\nfor Squid.\n[15] M. J. Fischer, N. A. Lynch, and M. S. Paterson. Impossibility of\nThis material is based upon work supported by the National\ndistributed consensus with one faulty process. J. ACM, 32(2):374–\nScience Foundation under CAREER Award CNS-0347339. Any\n382, 1985.\nopinions, findings, and conclusions or recommendations expressed\n[16] D. Grossman, G. Morrisett, T. Jim, M. Hicks, Y. Wang, and J. Cheney.\nin this material are those of the author(s) and do not necessarily\nRegion-based memory management in Cyclone. In PLDI ’02:\nreflect the views of the National Science Foundation.\nProceedings of the ACM SIGPLAN 2002 Conference on Programming\n∼\nDieHard is publicly available at http://www.cs.umass.edu/\nemery/\nlanguage design and implementation, pages 282–293, New York, NY,\ndiehard/.\nUSA, 2002. ACM Press.\n[17] D. Grunwald, B. Zorn, and R. Henderson. Improving the cache local-\nReferences\nity of memory allocation. In Proceedings of SIGPLAN’93 Conference\non Programming Languages Design and Implementation, volume\n[1] T. M. Austin, S. E. Breach, and G. S. Sohi. Efficient detection of\n28(6) of ACM SIGPLAN Notices, pages 177–186, Albuquerque, NM,\nall pointer and array access errors. In PLDI ’94: Proceedings of the\nJune 1993. ACM Press.\nACM SIGPLAN 1994 conference on Programming language design\nand implementation, pages 290–301, New York, NY, USA, 1994.\n[18] R. Hastings and B. Joyce. Purify: Fast detection of memory leaks and\nACM Press.\naccess errors. In Proc. of the Winter 1992 USENIX Conference, pages\n125–138, San Francisco, California, 1991.\n[2] A. Avizienis. The N-version approach to fault-tolerant systems.\nIEEE Transactions on Software Engineering, 11(12):1491–1501,\n[19] M. Hauswirth and T. M. Chilimbi. Low-overhead memory leak\nDec. 1985.\ndetection using adaptive statistical profiling. In ASPLOS-XI:\nProceedings of the 11th International Conference on Architectural\n[3] D. Avots, M. Dalton, V. B. Livshits, and M. S. Lam. Improving\nSupport for Programming Languages and Operating Systems, pages\nsoftware security with a C pointer analysis. In ICSE ’05: Proceedings\n156–164, New York, NY, USA, 2004. ACM Press.\nof the 27th international conference on Software engineering, pages\n332–341, New York, NY, USA, 2005. ACM Press.\n[20] M. Hertz and E. D. Berger. Quantifying the performance of garbage\ncollection vs. explicit memory management. In Proceedings of\n[4] T. Ball, S. Chaki, and S. K. Rajamani. Parameterized verification\nthe 20th annual ACM SIGPLAN Conference on Object-Oriented\nof multithreaded software libraries. In 7th International Conference\nProgramming Systems, Languages, and Applications, San Diego,\non Proceedings of Tools and Algorithms for the Construction and\nCA, Oct. 2005.\nAnalysis of Systems (TACAS), volume 2031 of Lecture Notes in\nComputer Science, pages 158–173, 2001.\n[21] T. Jim, J. G. Morrisett, D. Grossman, M. W. Hicks, J. Cheney, and\nY. Wang. Cyclone: A safe dialect of C. In Proceedings of the General\n[5] E. D. Berger, K. S. McKinley, R. D. Blumofe, and P. R. Wilson.\nTrack: 2002 USENIX Annual Technical Conference, pages 275–288,\nHoard: A scalable memory allocator for multithreaded applications.\nBerkeley, CA, USA, 2002. USENIX Association.\nIn ASPLOS-IX: Ninth International Conference on Architectural\nSupport for Programming Languages and Operating Systems, pages\n[22] M. S. Johnstone and P. R. Wilson. The memory fragmentation\n117–128, Cambridge, MA, Nov. 2000.\nproblem: Solved? In P. Dickman and P. R. Wilson, editors, OOPSLA\n’97 Workshop on Garbage Collection and Memory Management, Oct.\n[6] E. D. Berger, B. G. Zorn, and K. S. McKinley. Composing high-\n1997.\nperformance memory allocators. In Proceedings of the 2001 ACM\nSIGPLAN Conference on Programming Language Design and\n[23] M. Kaempf. Vudo malloc tricks. Phrack Magazine, 57(8), Aug. 2001.\nImplementation (PLDI), Snowbird, Utah, June 2001.\n[24] P.-H. Kamp. Malloc(3) revisited. http://phk.freebsd.dk/pubs/malloc.\n[7] S. Bhatkar, D. C. DuVarney, and R. Sekar. Address obfuscation:\npdf.\nAn efficient approach to combat a broad range of memory error\n[25] D. Lea. A memory allocator. http://gee.cs.oswego.edu/dl/html/malloc.html,\nexploits. In Proceedings of the 12th USENIX Security Symposium,\n1997.\npages 105–120. USENIX, Aug. 2003.\n[26] G. Marsaglia. yet another RNG. posted to the electronic bulletin\n[8] S. Bhatkar, R. Sekar, and D. C. DuVarney. Efficient techniques\nboard sci.stat.math, Aug. 1994.\nfor comprehensive protection from memory error exploits. In\nProceedings of the 14th USENIX Security Symposium, pages 271–\n[27] G. C. Necula, S. McPeak, and W. Weimer. Ccured: type-safe\n286. USENIX, Aug. 2005.\nretrofitting of legacy code. In POPL ’02: Proceedings of the 29th\nACM SIGPLAN-SIGACT symposium on Principles of programming\n[9] H.-J. Boehm and M. Weiser. Garbage collection in an uncooperative\nlanguages, pages 128–139, New York, NY, USA, 2002. ACM Press.\nenvironment. Software Practice and Experience, 18(9):807–820,\n1988.\n[28] N. Nethercote and J. Fitzhardinge. Bounds-checking entire programs\nwithout recompiling. In SPACE 2004, Venice, Italy, Jan. 2004.\n[10] T. C. Bressoud and F. B. Schneider. Hypervisor-based fault tolerance.\nIn SOSP ’95: Proceedings of the fifteenth ACM symposium on\n[29] PaX Team. PaX address space layout randomization (ASLR).\nOperating systems principles, pages 1–11, New York, NY, USA,\nhttp://pax.grsecurity.net/docs/aslr.txt.\n1995. ACM Press.\n\n-------- Page Break --------\n\n[30] F. Qin, J. Tucek, J. Sundaresan, and Y. Zhou. Rx: Treating bugs as   [38] N. Swamy, M. Hicks, G. Morrisett, D. Grossman, and T. Jim.\nallergies: A safe method to survive software failures. In Proceedings     Experience with safe manual memory management in Cyclone.\nof the Twentieth Symposium on Operating Systems Principles,      Science of Computer Programming, 2006. Special issue on memory\nvolume XX of Operating Systems Review, Brighton, UK, Oct. 2005.     management. Expands ISMM conference paper of the same name. To\nACM.                              appear.\n[31] M. Rinard, C. Cadar, D. Dumitran, D. M. Roy, and T. Leu. A dynamic   [39] US-CERT. US-CERT vulnerability notes. http://www.kb.cert.org/\ntechnique for eliminating buffer overflow vulnerabilities (and other     vuls/.\nmemory errors). In Proceedings of the 2004 Annual Computer\n[40] P. R. Wilson, M. S. Johnstone, M. Neely, and D. Boles. Dynamic\nSecurity Applications Conference, Dec. 2004.\nstorage allocation: A survey and critical review. In Proceedings of\n[32] M. Rinard, C. Cadar, D. Dumitran, D. M. Roy, T. Leu, and J. William     the International Workshop on Memory Management, volume 986 of\nS. Beebee. Enhancing server availability and security through failure-     Lecture Notes in Computer Science, pages 1–116, Kinross, Scotland,\noblivious computing. In Sixth Symposium on Operating Systems      Sept. 1995. Springer-Verlag.\nDesign and Implementation, San Francisco, CA, Dec. 2004. USENIX.\n[41] W. Xu, D. C. DuVarney, and R. Sekar. An efficient and backwards-\n[33] W. Robertson, C. Kruegel, D. Mutz, and F. Valeur. Run-time detection     compatible transformation to ensure memory safety of C programs.\nof heap-based overflows. In LISA ’03: Proceedings of the 17th      In SIGSOFT ’04/FSE-12: Proceedings of the 12th ACM SIGSOFT\nLarge Installation Systems Administration Conference, pages 51–60.     twelfth international symposium on Foundations of software engi-\nUSENIX, 2003.                          neering, pages 117–126, New York, NY, USA, 2004. ACM Press.\n[34] J. M. Robson. Bounds for some functions concerning dynamic    [42] S. H. Yong and S. Horwitz. Protecting C programs from attacks via\nstorage allocation. Journal of the ACM, 21(3):419–499, July 1974.      invalid pointer dereferences. In ESEC/FSE-11: 11th ACM SIGSOFT\nInternational Symposium on Foundations of Software Engineering,\n[35] J. Seward and N. Nethercote. Using Valgrind to detect undefined\npages 307–316, New York, NY, USA, 2003. ACM Press.\nvalue errors with bit-precision. In Proceedings of the USENIX’05\nAnnual Technical Conference, Anaheim, California, USA, Apr. 2005.\n[43] Y. Younan, W. Joosen, F. Piessens, and H. V. den Eynden. Security\nof memory allocators for C and C++. Technical Report CW 419,\n[36] H. Shacham, M. Page, B. Pfaff, E.-J. Goh, N. Modadugu, and\nDepartment of Computer Science, Katholieke Universiteit Leuven,\nD. Boneh. On the effectiveness of address-space randomization.\nBelgium, July 2005. Available at http://www.cs.kuleuven.ac.be/\nIn CCS ’04: Proceedings of the 11th ACM conference on Computer\npublicaties/rapporten/cw/CW419.pdf.\nand Communications Security, pages 298–307, New York, NY, USA,\n[44] B. Zorn. The measured cost of conservative garbage collection.\n2004. ACM Press.\nSoftware Practice and Experience, 23:733–756, 1993.\n[37] Standard Performance Evaluation Corporation. SPEC2000.\nhttp://www.spec.org.\n```\n\nGiven the paper in DOCS, generate a 140 character tweet that\ncaptures the paper idea and make it interesting.\n"
        }
      ]
    }
  ],
  "stream": true
}
``````

</details>

-   response: 200 OK

</details>



<details id="📩-llm-response" class="genaiscript">
<summary>
📩 llm response
</summary>



<details id="output" class="genaiscript">
<summary>
output
</summary>


```markdown
DieHard, a runtime system, enhances C/C++ memory safety by randomizing object placement in the heap, reducing crashes and security risks. #DieHard #MemorySafety #CplusplusSecurity
```

</details>


</details>

