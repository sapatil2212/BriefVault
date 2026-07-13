import { profileUpdateSchema } from "../src/lib/validations/auth";

const res = profileUpdateSchema.safeParse({
  firstName: "Profile update test",
  lastName: "Patil",
  phone: "8830553868",
  organization: "SAP",
  orgType: "Bank / NBFC",
  designation: "MD",
  country: "India"
});

console.log("Validation Result:", JSON.stringify(res, null, 2));
