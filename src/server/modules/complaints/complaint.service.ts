"server-only";
import { findAllComplaints, type FindComplaintParams } from "./complaint.repository";

export async function getComplaintList(params: FindComplaintParams) {
  return findAllComplaints(params);
}
