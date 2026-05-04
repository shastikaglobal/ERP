import express from "express";
import cors from "cors";
import { randomUUID } from "crypto";
import { supabase } from "./supabase.js";
import type {
  EmployeeProductivityInput,
  EmployeeProductivityMetric,
  EmployeeAttendanceInput,
  EmployeeAttendanceRecord,
  EmployeeTaskInput,
  EmployeeTaskRecord,
} from "./types.js";

const app = express();
const port = Number(process.env.PORT || 4000);

app.use(cors({ origin: process.env.CORS_ORIGIN || true }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/employee-productivity", async (req, res) => {
  try {
    const companyId = req.query.company_id as string | undefined;
    let query = supabase
      .from("employee_productivity_metrics")
      .select(`
        id,
        company_id,
        profile_id,
        active,
        role,
        department,
        attendance_pct,
        tasks_completed,
        avg_response_minutes,
        productivity_score,
        performance_label,
        created_at,
        updated_at,
        profile:profiles(full_name,email,phone,status,requested_role)
      `)
      .order("productivity_score", { ascending: false });

    if (companyId) {
      query = query.eq("company_id", companyId);
    }

    const { data, error } = await query;
    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json(data as unknown as EmployeeProductivityMetric[]);
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

app.post("/employee-productivity", async (req, res) => {
  try {
    const payload = req.body as EmployeeProductivityInput;
    const requiredFields = [
      "company_id",
      "profile_id",
      "role",
      "department",
      "attendance_pct",
      "tasks_completed",
      "avg_response_minutes",
      "productivity_score",
      "performance_label",
    ];

    for (const field of requiredFields) {
      if (payload[field as keyof EmployeeProductivityInput] === undefined) {
        return res.status(400).json({ error: `Missing required field: ${field}` });
      }
    }

    const { data, error } = await supabase
      .from("employee_productivity_metrics")
      .insert(payload)
      .select(`
        id,
        company_id,
        profile_id,
        active,
        role,
        department,
        attendance_pct,
        tasks_completed,
        avg_response_minutes,
        productivity_score,
        performance_label,
        created_at,
        updated_at,
        profile:profiles(full_name,email,phone,status,requested_role)
      `)
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(201).json(data as unknown as EmployeeProductivityMetric);
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

app.post("/employees", async (req, res) => {
  try {
    const { full_name, email, phone, role, department, company_id } = req.body as {
      full_name: string;
      email: string;
      phone: string;
      role: string;
      department: string;
      company_id?: string;
    };

    if (!full_name || !email || !role || !department) {
      return res.status(400).json({ error: "Missing required employee fields" });
    }

    const password = `${randomUUID()}Aa1!`;
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
        phone,
        requested_role: role,
      },
    });

    if (userError || !userData?.user?.id) {
      return res.status(500).json({ error: userError?.message || "Failed to create user" });
    }

    const profileUserId = userData.user.id;

    if (company_id) {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          company_id,
          full_name,
          phone,
          status: "approved",
          requested_role: role,
          approved_at: new Date().toISOString(),
          approved_by: profileUserId,
        })
        .eq("id", profileUserId);

      if (updateError) {
        return res.status(500).json({ error: updateError.message });
      }
    }

    const { data: profileData, error: profileFetchError } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", profileUserId)
      .single();

    if (profileFetchError || !profileData) {
      return res.status(500).json({ error: profileFetchError?.message || "Failed to read profile" });
    }

    const { data: metricData, error: metricError } = await supabase
      .from("employee_productivity_metrics")
      .insert({
        profile_id: profileUserId,
        company_id: profileData.company_id,
        role,
        department,
        active: true,
        attendance_pct: 0,
        avg_response_minutes: 0,
        performance_label: "New",
        productivity_score: 0,
        tasks_completed: 0,
      })
      .select(`
        id,
        company_id,
        profile_id,
        active,
        role,
        department,
        attendance_pct,
        tasks_completed,
        avg_response_minutes,
        productivity_score,
        performance_label,
        created_at,
        updated_at,
        profile:profiles(full_name,email,phone,status,requested_role)
      `)
      .single();

    if (metricError) {
      return res.status(500).json({ error: metricError.message });
    }

    return res.status(201).json(metricData as unknown as EmployeeProductivityMetric);
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

app.put("/employee-productivity/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const updates = req.body as Partial<EmployeeProductivityInput>;

    const { data, error } = await supabase
      .from("employee_productivity_metrics")
      .update(updates)
      .eq("id", id)
      .select(`
        id,
        company_id,
        profile_id,
        active,
        role,
        department,
        attendance_pct,
        tasks_completed,
        avg_response_minutes,
        productivity_score,
        performance_label,
        created_at,
        updated_at,
        profile:profiles(full_name,email,phone,status,requested_role)
      `)
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json(data as unknown as EmployeeProductivityMetric);
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

app.get("/employee-attendance", async (req, res) => {
  try {
    const companyId = req.query.company_id as string | undefined;
    let query = supabase
      .from("employee_attendance_records")
      .select(`
        id,
        company_id,
        profile_id,
        date,
        status,
        notes,
        created_at,
        updated_at
      `)
      .order("date", { ascending: false });

    if (companyId) {
      query = query.eq("company_id", companyId);
    }

    const { data, error } = await query;
    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json(data as EmployeeAttendanceRecord[]);
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

app.post("/employee-attendance", async (req, res) => {
  try {
    const payload = req.body as EmployeeAttendanceInput;
    const requiredFields = ["company_id", "profile_id", "date", "status"];

    for (const field of requiredFields) {
      if (payload[field as keyof EmployeeAttendanceInput] === undefined) {
        return res.status(400).json({ error: `Missing required field: ${field}` });
      }
    }

    const { data, error } = await supabase
      .from("employee_attendance_records")
      .insert(payload)
      .select(`
        id,
        company_id,
        profile_id,
        date,
        status,
        notes,
        created_at,
        updated_at
      `)
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(201).json(data as EmployeeAttendanceRecord);
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

app.put("/employee-attendance/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const updates = req.body as Partial<EmployeeAttendanceInput>;

    const { data, error } = await supabase
      .from("employee_attendance_records")
      .update(updates)
      .eq("id", id)
      .select(`
        id,
        company_id,
        profile_id,
        date,
        status,
        notes,
        created_at,
        updated_at
      `)
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json(data as EmployeeAttendanceRecord);
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

app.get("/employee-tasks", async (req, res) => {
  try {
    const companyId = req.query.company_id as string | undefined;
    let query = supabase
      .from("employee_task_history")
      .select(`
        id,
        company_id,
        profile_id,
        title,
        description,
        due_date,
        completed,
        completed_at,
        points,
        created_at,
        updated_at
      `)
      .order("due_date", { ascending: false });

    if (companyId) {
      query = query.eq("company_id", companyId);
    }

    const { data, error } = await query;
    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json(data as EmployeeTaskRecord[]);
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

app.post("/employee-tasks", async (req, res) => {
  try {
    const payload = req.body as EmployeeTaskInput;
    const requiredFields = ["company_id", "profile_id", "title", "due_date"];

    for (const field of requiredFields) {
      if (payload[field as keyof EmployeeTaskInput] === undefined) {
        return res.status(400).json({ error: `Missing required field: ${field}` });
      }
    }

    const insertPayload: EmployeeTaskInput = {
      ...payload,
      completed: payload.completed ?? false,
      completed_at: payload.completed ? payload.completed_at ?? new Date().toISOString() : null,
      points: payload.points ?? 0,
    };

    const { data, error } = await supabase
      .from("employee_task_history")
      .insert(insertPayload)
      .select(`
        id,
        company_id,
        profile_id,
        title,
        description,
        due_date,
        completed,
        completed_at,
        points,
        created_at,
        updated_at
      `)
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(201).json(data as EmployeeTaskRecord);
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

app.put("/employee-tasks/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const updates = req.body as Partial<EmployeeTaskInput>;

    const { data, error } = await supabase
      .from("employee_task_history")
      .update(updates)
      .eq("id", id)
      .select(`
        id,
        company_id,
        profile_id,
        title,
        description,
        due_date,
        completed,
        completed_at,
        points,
        created_at,
        updated_at
      `)
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json(data as EmployeeTaskRecord);
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

app.listen(port, () => {
  console.log(`Employee productivity backend listening on http://localhost:${port}`);
});
