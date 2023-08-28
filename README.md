# Migration Use Case Demos for LaunchDarkly
This repository houses the code for performing various types of demonstrations of the migration use case for 
LaunchDarkly.  The premise is that using feature flags, we can help make bespoke, application centric migration paths
safer and less error prone through the enablement of three best practices.  These are:

## Leverage Production Traffic
Production traffic helps you to test the correctness of your migration logic, gain 
operational confidence with your target architecture, and creates a change data capture path that other migration 
tooling may not provide.

## Make It Gradual
Most migrations involve a sudden shift from one system to another in a single smooth motion.  
Experience has taught us that most of these single motions aren't that smooth, and that there's a need for more 
robust fallback positions than "restore from backup when it goes wrong".  We use multi-stage migration plans to 
carve out safe fallback positions and validate our work at each step, helping us to get started faster, and make 
incremental progress.

## Split It into Cohorts
Traffic often comes with varying degrees of challenges.  Some of our traffic is easy to handle, has simple semantics, 
and tends to be spread out in a predictable pattern.  Other traffic has quirky data, unpredictable spikes, and other 
nuances that make it more challenging.  To enable us to gain confidence with our simple traffic while working on the 
more difficult cohorts, we enable different segments to be in different stages of our migration simultaneously.  This 
helps us continue to progress when challenging traffic and holdouts would otherwise halt our progress.

# Setting Up the Demo
To run this demo, you will need to have Node.js 16+ installed on your workstation, along with a distribution of npm and 
yarn to install dependencies, build the application, and optionally run it.

The demo requires access to a LaunchDarkly project with at least one environment, and a flag with the key 
"database-migration".  This flag must have six variations, each with the following keys.

- "off" - The off state of the migration, where the read and write traffic only occurs on the legacy database.
- "dualwrite" - The initial CDC stage of the migration, where we start writing data to our new database as well.
- "shadow" - The initial validation stage of the migration where we start reading data from the new database and 
  comparing it with the legacy database.
- "live" - The first cutover phase of the migration, where we begin serving data from the new database as authoritative,
  but continue to read the legacy database for validation.
- "rampdown" - The second cutover phase of the migration, where we halt validation on the legacy database, but keep up
  writes, just in case something catastrophic happens.
- "complete" - The final cutover phase of the migration, where we halt writes to the legacy database and commit to the 
  new system.

Once you have this project, environment, and flag created, configure the demo with the SDK Key.  Copy the 
```.env.sample``` file to ```.env``` and add the value of the SDK Key to the LAUNCHDARKLY_SDK_KEY environment variable.

Install the dependencies for the demo by running ```yarn install``` in the root directory, and then build the demo by 
running ```yarn build```.  This will create an executable distribution in the ```dist``` directory.  You can run this 
demo by running ```yarn start``` or changing your working directory to ```dist``` and running ```node index.js```.

# Description
The demo is a simple console application that shows 300 users across 10 organizations, and the state of the migration 
that they are experiencing at the point in time when the flag rules change.  Each user is represented by a display that 
looks like ```[rw -> rw]```.  The left "rw" represents reads and writes to the legacy system.  The right represents 
reads and writes to the new system.  When each of these aspects is active, it will be shown in green.  It will be shown 
in grey when inactive.  Finally, the "rw" of the authoritative system will be displayed as "RW" with an underline.  It 
will change from legacy to new on the move from "shadow" to "live".

This display is useful for showing exactly what would be happening in the application logic, rather than just showing 
the value of the flag.  This demo does not actually go through the motions of migrating data, as this would require 
complex and ongoing setup maintenance.  It serves to demonstrate the actual parts that LaunchDarkly helps to control, 
without the need to focus on other migration tooling as a part of the demo.  Speaking to when backfill tools and CDC 
might apply in the script should be sufficient.

# Suggested Script/Demonstration Flow

Start with the flag configured with targeting off, and serving the "off" variation for both the default and targeting 
off states.

Turn on targeting, and carve out the segment of traffic for the organization.name value of "LaunchDarkly", as this 
should represent trying it out internally on your own traffic first.  Set the serve value to "dualwrite" and save.  The 
console will refresh and some of the new system write indicators will light up.

Add a progressive rollout for writes, and slowly bring this to 100% over one or two changes, showing a progressive 
release of dual writes to build operational confidence.  Mention, once the 100% mark of writes is reached, that we can 
now use a backfill tool of our choice, or a script to bulk copy from the legacy database to the new database, and rely 
on this dual write functionality to sync the databases.

Move the LaunchDarkly cohort to "shadow" for read verification.  We're now validating reads from the new system against 
our old system for LaunchDarkly traffic.

For now, we progressively release to 10% of our additional traffic.  Here, you might say that we noticed that writes 
from the "Icecaproductions" organization seem to be producing inconsistent results.  So, we carve out the 
organization.name value of "Icecaproductions" set it back to dualwrite, and continue rolling out the progression to 
100% for other traffic.  We now have a holdout, but we're still able to validate that the traffic is working correctly 
for the rest of our workload, and verify that the new system can handle the workload.

We say that we've fixed the "Icecaproductions" issue, and now want to progressively roll back to shadow for that 
cohort.  Before we do that, we use a partial backfill to restore the Icecaproductions data in the new system to a valid 
state, then move back to the shadow stage.  Validation now looks good, and everyone is reading and writing to the new 
system as well as the legacy.

It's time to start moving to the new system as authoritative, but we want to keep checking our work on the legacy 
database for a while.  We roll out the "live" stage to our internal users, then progressively release to everyone, 
except for the previous problem cohort "Icecaproductions", since it caused some issues, and we want to spend a little 
more time observing.  Then we rollout to Icecaproductions.

At this point, everyone's on the new database for reads and writes, with writes going back to the legacy database, as 
well as reads being validated from the legacy database.  Having seen no issues for a few weeks, we feel confident that 
we can start halting our validation phase.  We begin by moving our internal traffic to "rampdown", then the rest of our 
traffic.  If a customer informed us of missing or incorrect data, we could always move them back to dualwrite or shadow,
remediate, backfill, and reprogress them to the "live" and "rampdown" stages.

With no issues reported over the last month, we now feel confident that we can fully commit to the new system.  At this 
point, we set our stage to complete, which halts writes to the legacy system, and completes our migration.  For 
customers who reported issues during rampdown, we can leave them in rampdown for a little longer, just to make sure no 
lingering problems occur, before rolling them to complete.

We are now ready to take a final backup of our legacy database and decommission the resources.