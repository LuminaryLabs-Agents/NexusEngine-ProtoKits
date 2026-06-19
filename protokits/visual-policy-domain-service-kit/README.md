# Visual Policy Domain Service Kit

Owns renderer-agnostic visual intent and quality policy.

Use it to describe target frame time, preferred visual profile, maximum profile, memory budget, dynamic resolution, battery preference, expensive-effect permission, and accessibility flags.

It overlaps with older visual fidelity helpers only at the intent level. This kit is the domain policy layer; renderer/adapters consume the policy later.
