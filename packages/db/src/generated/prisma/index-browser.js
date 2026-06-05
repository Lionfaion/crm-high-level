
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.AgencyScalarFieldEnum = {
  id: 'id',
  name: 'name',
  domain: 'domain',
  logoUrl: 'logoUrl',
  email: 'email',
  phone: 'phone',
  address: 'address',
  city: 'city',
  state: 'state',
  country: 'country',
  zipCode: 'zipCode',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AccountScalarFieldEnum = {
  id: 'id',
  agencyId: 'agencyId',
  name: 'name',
  email: 'email',
  phone: 'phone',
  website: 'website',
  logoUrl: 'logoUrl',
  timezone: 'timezone',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  agencyId: 'agencyId',
  accountId: 'accountId',
  email: 'email',
  name: 'name',
  avatarUrl: 'avatarUrl',
  role: 'role',
  passwordHash: 'passwordHash',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ContactScalarFieldEnum = {
  id: 'id',
  accountId: 'accountId',
  email: 'email',
  firstName: 'firstName',
  lastName: 'lastName',
  phone: 'phone',
  company: 'company',
  website: 'website',
  address: 'address',
  city: 'city',
  state: 'state',
  country: 'country',
  status: 'status',
  tags: 'tags',
  customFields: 'customFields',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PipelineScalarFieldEnum = {
  id: 'id',
  accountId: 'accountId',
  name: 'name',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.StageScalarFieldEnum = {
  id: 'id',
  pipelineId: 'pipelineId',
  name: 'name',
  position: 'position',
  color: 'color',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.OpportunityScalarFieldEnum = {
  id: 'id',
  contactId: 'contactId',
  stageId: 'stageId',
  ownerId: 'ownerId',
  name: 'name',
  value: 'value',
  status: 'status',
  closeDate: 'closeDate',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.NoteScalarFieldEnum = {
  id: 'id',
  contactId: 'contactId',
  opportunityId: 'opportunityId',
  authorId: 'authorId',
  body: 'body',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ActivityScalarFieldEnum = {
  id: 'id',
  accountId: 'accountId',
  contactId: 'contactId',
  opportunityId: 'opportunityId',
  userId: 'userId',
  type: 'type',
  metadata: 'metadata',
  createdAt: 'createdAt'
};

exports.Prisma.AccountSettingsScalarFieldEnum = {
  id: 'id',
  accountId: 'accountId',
  businessName: 'businessName',
  supportEmail: 'supportEmail',
  supportPhone: 'supportPhone',
  timezone: 'timezone',
  currency: 'currency',
  logoUrl: 'logoUrl',
  faviconUrl: 'faviconUrl',
  primaryColor: 'primaryColor',
  secondaryColor: 'secondaryColor',
  facebookUrl: 'facebookUrl',
  instagramUrl: 'instagramUrl',
  linkedinUrl: 'linkedinUrl',
  twitterUrl: 'twitterUrl',
  emailNotifications: 'emailNotifications',
  smsNotifications: 'smsNotifications',
  address: 'address',
  city: 'city',
  state: 'state',
  country: 'country',
  zipCode: 'zipCode',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ConversationScalarFieldEnum = {
  id: 'id',
  accountId: 'accountId',
  contactId: 'contactId',
  channel: 'channel',
  status: 'status',
  subject: 'subject',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.MessageScalarFieldEnum = {
  id: 'id',
  conversationId: 'conversationId',
  direction: 'direction',
  body: 'body',
  html: 'html',
  subject: 'subject',
  fromAddress: 'fromAddress',
  toAddress: 'toAddress',
  externalId: 'externalId',
  sentAt: 'sentAt',
  readAt: 'readAt'
};

exports.Prisma.CampaignScalarFieldEnum = {
  id: 'id',
  accountId: 'accountId',
  name: 'name',
  type: 'type',
  status: 'status',
  subject: 'subject',
  body: 'body',
  fromName: 'fromName',
  fromEmail: 'fromEmail',
  fromPhone: 'fromPhone',
  tags: 'tags',
  scheduledAt: 'scheduledAt',
  sentAt: 'sentAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CampaignRecipientScalarFieldEnum = {
  id: 'id',
  campaignId: 'campaignId',
  contactId: 'contactId',
  sentAt: 'sentAt',
  openedAt: 'openedAt',
  clickedAt: 'clickedAt'
};

exports.Prisma.ChatbotRuleScalarFieldEnum = {
  id: 'id',
  accountId: 'accountId',
  trigger: 'trigger',
  response: 'response',
  isActive: 'isActive',
  priority: 'priority',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ChatWidgetScalarFieldEnum = {
  id: 'id',
  accountId: 'accountId',
  greeting: 'greeting',
  primaryColor: 'primaryColor',
  agentName: 'agentName',
  agentAvatarUrl: 'agentAvatarUrl',
  isEnabled: 'isEnabled',
  allowedDomains: 'allowedDomains',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.WorkflowScalarFieldEnum = {
  id: 'id',
  accountId: 'accountId',
  name: 'name',
  description: 'description',
  status: 'status',
  triggerType: 'triggerType',
  triggerConfig: 'triggerConfig',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.WorkflowStepScalarFieldEnum = {
  id: 'id',
  workflowId: 'workflowId',
  position: 'position',
  actionType: 'actionType',
  config: 'config',
  createdAt: 'createdAt'
};

exports.Prisma.WorkflowRunScalarFieldEnum = {
  id: 'id',
  workflowId: 'workflowId',
  contactId: 'contactId',
  status: 'status',
  triggeredBy: 'triggeredBy',
  startedAt: 'startedAt',
  finishedAt: 'finishedAt',
  errorMsg: 'errorMsg'
};

exports.Prisma.WorkflowStepLogScalarFieldEnum = {
  id: 'id',
  runId: 'runId',
  stepId: 'stepId',
  status: 'status',
  output: 'output',
  errorMsg: 'errorMsg',
  executedAt: 'executedAt'
};

exports.Prisma.CalendarSettingsScalarFieldEnum = {
  id: 'id',
  accountId: 'accountId',
  timezone: 'timezone',
  workingHoursStart: 'workingHoursStart',
  workingHoursEnd: 'workingHoursEnd',
  workingDays: 'workingDays',
  googleCalendarId: 'googleCalendarId',
  googleRefreshToken: 'googleRefreshToken',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AppointmentTypeScalarFieldEnum = {
  id: 'id',
  accountId: 'accountId',
  name: 'name',
  description: 'description',
  duration: 'duration',
  color: 'color',
  isActive: 'isActive',
  slug: 'slug',
  bufferBefore: 'bufferBefore',
  bufferAfter: 'bufferAfter',
  maxPerDay: 'maxPerDay',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AppointmentScalarFieldEnum = {
  id: 'id',
  accountId: 'accountId',
  appointmentTypeId: 'appointmentTypeId',
  contactId: 'contactId',
  userId: 'userId',
  title: 'title',
  startAt: 'startAt',
  endAt: 'endAt',
  status: 'status',
  notes: 'notes',
  locationUrl: 'locationUrl',
  reminderSentAt: 'reminderSentAt',
  cancelledAt: 'cancelledAt',
  cancelReason: 'cancelReason',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.FormScalarFieldEnum = {
  id: 'id',
  accountId: 'accountId',
  name: 'name',
  description: 'description',
  isActive: 'isActive',
  redirectUrl: 'redirectUrl',
  submitText: 'submitText',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.FormFieldScalarFieldEnum = {
  id: 'id',
  formId: 'formId',
  label: 'label',
  fieldType: 'fieldType',
  placeholder: 'placeholder',
  required: 'required',
  options: 'options',
  position: 'position',
  mappedField: 'mappedField',
  createdAt: 'createdAt'
};

exports.Prisma.FormSubmissionScalarFieldEnum = {
  id: 'id',
  formId: 'formId',
  contactId: 'contactId',
  data: 'data',
  ipAddress: 'ipAddress',
  userAgent: 'userAgent',
  createdAt: 'createdAt'
};

exports.Prisma.FunnelScalarFieldEnum = {
  id: 'id',
  accountId: 'accountId',
  name: 'name',
  description: 'description',
  isActive: 'isActive',
  domain: 'domain',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.FunnelPageScalarFieldEnum = {
  id: 'id',
  funnelId: 'funnelId',
  name: 'name',
  slug: 'slug',
  position: 'position',
  content: 'content',
  isEnabled: 'isEnabled',
  views: 'views',
  conversions: 'conversions',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ReviewScalarFieldEnum = {
  id: 'id',
  accountId: 'accountId',
  contactId: 'contactId',
  source: 'source',
  rating: 'rating',
  title: 'title',
  body: 'body',
  reviewerName: 'reviewerName',
  reviewUrl: 'reviewUrl',
  status: 'status',
  response: 'response',
  respondedAt: 'respondedAt',
  reviewedAt: 'reviewedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ReviewRequestScalarFieldEnum = {
  id: 'id',
  accountId: 'accountId',
  contactId: 'contactId',
  channel: 'channel',
  sentAt: 'sentAt',
  openedAt: 'openedAt',
  clickedAt: 'clickedAt',
  reviewedAt: 'reviewedAt',
  createdAt: 'createdAt'
};

exports.Prisma.ProductScalarFieldEnum = {
  id: 'id',
  accountId: 'accountId',
  name: 'name',
  description: 'description',
  price: 'price',
  currency: 'currency',
  isActive: 'isActive',
  stripePriceId: 'stripePriceId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.InvoiceScalarFieldEnum = {
  id: 'id',
  accountId: 'accountId',
  contactId: 'contactId',
  number: 'number',
  status: 'status',
  currency: 'currency',
  subtotal: 'subtotal',
  taxRate: 'taxRate',
  taxAmount: 'taxAmount',
  total: 'total',
  notes: 'notes',
  dueDate: 'dueDate',
  sentAt: 'sentAt',
  paidAt: 'paidAt',
  stripeInvoiceId: 'stripeInvoiceId',
  paymentUrl: 'paymentUrl',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.InvoiceItemScalarFieldEnum = {
  id: 'id',
  invoiceId: 'invoiceId',
  productId: 'productId',
  description: 'description',
  quantity: 'quantity',
  unitPrice: 'unitPrice',
  total: 'total'
};

exports.Prisma.PaymentScalarFieldEnum = {
  id: 'id',
  accountId: 'accountId',
  invoiceId: 'invoiceId',
  contactId: 'contactId',
  amount: 'amount',
  currency: 'currency',
  status: 'status',
  method: 'method',
  stripePaymentIntentId: 'stripePaymentIntentId',
  paidAt: 'paidAt',
  createdAt: 'createdAt'
};

exports.Prisma.CourseScalarFieldEnum = {
  id: 'id',
  accountId: 'accountId',
  title: 'title',
  description: 'description',
  slug: 'slug',
  imageUrl: 'imageUrl',
  isPublished: 'isPublished',
  price: 'price',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CourseSectionScalarFieldEnum = {
  id: 'id',
  courseId: 'courseId',
  title: 'title',
  position: 'position',
  createdAt: 'createdAt'
};

exports.Prisma.CourseLessonScalarFieldEnum = {
  id: 'id',
  sectionId: 'sectionId',
  title: 'title',
  content: 'content',
  videoUrl: 'videoUrl',
  fileUrl: 'fileUrl',
  duration: 'duration',
  position: 'position',
  isPreview: 'isPreview',
  dripDays: 'dripDays',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.EnrollmentScalarFieldEnum = {
  id: 'id',
  courseId: 'courseId',
  contactId: 'contactId',
  enrolledAt: 'enrolledAt',
  completedAt: 'completedAt',
  expiresAt: 'expiresAt'
};

exports.Prisma.LessonProgressScalarFieldEnum = {
  id: 'id',
  enrollmentId: 'enrollmentId',
  lessonId: 'lessonId',
  completedAt: 'completedAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull
};

exports.Prisma.JsonNullValueInput = {
  JsonNull: Prisma.JsonNull
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};
exports.UserRole = exports.$Enums.UserRole = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  AGENCY_ADMIN: 'AGENCY_ADMIN',
  AGENCY_USER: 'AGENCY_USER',
  ACCOUNT_ADMIN: 'ACCOUNT_ADMIN',
  ACCOUNT_USER: 'ACCOUNT_USER'
};

exports.ContactStatus = exports.$Enums.ContactStatus = {
  LEAD: 'LEAD',
  PROSPECT: 'PROSPECT',
  CUSTOMER: 'CUSTOMER',
  CHURNED: 'CHURNED'
};

exports.OpportunityStatus = exports.$Enums.OpportunityStatus = {
  OPEN: 'OPEN',
  WON: 'WON',
  LOST: 'LOST',
  ABANDONED: 'ABANDONED'
};

exports.ActivityType = exports.$Enums.ActivityType = {
  NOTE_ADDED: 'NOTE_ADDED',
  EMAIL_SENT: 'EMAIL_SENT',
  EMAIL_RECEIVED: 'EMAIL_RECEIVED',
  CALL_MADE: 'CALL_MADE',
  CALL_RECEIVED: 'CALL_RECEIVED',
  MEETING_SCHEDULED: 'MEETING_SCHEDULED',
  MEETING_COMPLETED: 'MEETING_COMPLETED',
  STAGE_CHANGED: 'STAGE_CHANGED',
  OPPORTUNITY_CREATED: 'OPPORTUNITY_CREATED',
  OPPORTUNITY_WON: 'OPPORTUNITY_WON',
  OPPORTUNITY_LOST: 'OPPORTUNITY_LOST',
  CONTACT_CREATED: 'CONTACT_CREATED',
  CONTACT_UPDATED: 'CONTACT_UPDATED',
  TASK_CREATED: 'TASK_CREATED',
  TASK_COMPLETED: 'TASK_COMPLETED'
};

exports.Channel = exports.$Enums.Channel = {
  EMAIL: 'EMAIL',
  SMS: 'SMS',
  CHAT: 'CHAT'
};

exports.ConversationStatus = exports.$Enums.ConversationStatus = {
  OPEN: 'OPEN',
  CLOSED: 'CLOSED',
  ARCHIVED: 'ARCHIVED'
};

exports.MessageDirection = exports.$Enums.MessageDirection = {
  INBOUND: 'INBOUND',
  OUTBOUND: 'OUTBOUND'
};

exports.CampaignType = exports.$Enums.CampaignType = {
  EMAIL: 'EMAIL',
  SMS: 'SMS'
};

exports.CampaignStatus = exports.$Enums.CampaignStatus = {
  DRAFT: 'DRAFT',
  SCHEDULED: 'SCHEDULED',
  SENDING: 'SENDING',
  SENT: 'SENT',
  PAUSED: 'PAUSED',
  CANCELLED: 'CANCELLED'
};

exports.WorkflowStatus = exports.$Enums.WorkflowStatus = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  ARCHIVED: 'ARCHIVED'
};

exports.TriggerType = exports.$Enums.TriggerType = {
  CONTACT_CREATED: 'CONTACT_CREATED',
  CONTACT_UPDATED: 'CONTACT_UPDATED',
  TAG_ADDED: 'TAG_ADDED',
  TAG_REMOVED: 'TAG_REMOVED',
  FORM_SUBMITTED: 'FORM_SUBMITTED',
  APPOINTMENT_BOOKED: 'APPOINTMENT_BOOKED',
  OPPORTUNITY_CREATED: 'OPPORTUNITY_CREATED',
  OPPORTUNITY_WON: 'OPPORTUNITY_WON',
  OPPORTUNITY_LOST: 'OPPORTUNITY_LOST',
  INBOUND_MESSAGE: 'INBOUND_MESSAGE',
  MANUAL: 'MANUAL'
};

exports.ActionType = exports.$Enums.ActionType = {
  SEND_EMAIL: 'SEND_EMAIL',
  SEND_SMS: 'SEND_SMS',
  ADD_TAG: 'ADD_TAG',
  REMOVE_TAG: 'REMOVE_TAG',
  WAIT: 'WAIT',
  WEBHOOK: 'WEBHOOK',
  ASSIGN_USER: 'ASSIGN_USER',
  CREATE_OPPORTUNITY: 'CREATE_OPPORTUNITY',
  UPDATE_CONTACT: 'UPDATE_CONTACT',
  INTERNAL_NOTE: 'INTERNAL_NOTE'
};

exports.WorkflowRunStatus = exports.$Enums.WorkflowRunStatus = {
  RUNNING: 'RUNNING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED'
};

exports.AppointmentStatus = exports.$Enums.AppointmentStatus = {
  SCHEDULED: 'SCHEDULED',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
  COMPLETED: 'COMPLETED',
  NO_SHOW: 'NO_SHOW'
};

exports.FormFieldType = exports.$Enums.FormFieldType = {
  TEXT: 'TEXT',
  EMAIL: 'EMAIL',
  PHONE: 'PHONE',
  SELECT: 'SELECT',
  CHECKBOX: 'CHECKBOX',
  DATE: 'DATE',
  TEXTAREA: 'TEXTAREA',
  NUMBER: 'NUMBER',
  RADIO: 'RADIO'
};

exports.ReviewSource = exports.$Enums.ReviewSource = {
  GOOGLE: 'GOOGLE',
  FACEBOOK: 'FACEBOOK',
  YELP: 'YELP',
  INTERNAL: 'INTERNAL',
  OTHER: 'OTHER'
};

exports.ReviewStatus = exports.$Enums.ReviewStatus = {
  PENDING: 'PENDING',
  PUBLISHED: 'PUBLISHED',
  HIDDEN: 'HIDDEN',
  RESPONDED: 'RESPONDED'
};

exports.InvoiceStatus = exports.$Enums.InvoiceStatus = {
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  PAID: 'PAID',
  OVERDUE: 'OVERDUE',
  VOID: 'VOID'
};

exports.PaymentStatus = exports.$Enums.PaymentStatus = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED'
};

exports.Prisma.ModelName = {
  Agency: 'Agency',
  Account: 'Account',
  User: 'User',
  Contact: 'Contact',
  Pipeline: 'Pipeline',
  Stage: 'Stage',
  Opportunity: 'Opportunity',
  Note: 'Note',
  Activity: 'Activity',
  AccountSettings: 'AccountSettings',
  Conversation: 'Conversation',
  Message: 'Message',
  Campaign: 'Campaign',
  CampaignRecipient: 'CampaignRecipient',
  ChatbotRule: 'ChatbotRule',
  ChatWidget: 'ChatWidget',
  Workflow: 'Workflow',
  WorkflowStep: 'WorkflowStep',
  WorkflowRun: 'WorkflowRun',
  WorkflowStepLog: 'WorkflowStepLog',
  CalendarSettings: 'CalendarSettings',
  AppointmentType: 'AppointmentType',
  Appointment: 'Appointment',
  Form: 'Form',
  FormField: 'FormField',
  FormSubmission: 'FormSubmission',
  Funnel: 'Funnel',
  FunnelPage: 'FunnelPage',
  Review: 'Review',
  ReviewRequest: 'ReviewRequest',
  Product: 'Product',
  Invoice: 'Invoice',
  InvoiceItem: 'InvoiceItem',
  Payment: 'Payment',
  Course: 'Course',
  CourseSection: 'CourseSection',
  CourseLesson: 'CourseLesson',
  Enrollment: 'Enrollment',
  LessonProgress: 'LessonProgress'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
