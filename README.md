# Database

## Concurrency Control

    1. without locking
    2. using pessimistic concurrency control
    3. using optimistic concurrency control

### problems caused due to concurrency

    1. dirty read
    2. non repeatable read
    3. phantom reads

### isolation levels (high to low concurrency)

    1. read uncommitted
    2. read committed
    3. repeatable read
    4. serializable

    optimistic concurrency control has high concurrency. minimizes the need for locks. Can cause high rollbacks. checks for conflicts during update phase.

    PCC manages simultaneous transactions by assuming that conflicts are likely to happen. to prevent conflicts it uses locking mechanisms
